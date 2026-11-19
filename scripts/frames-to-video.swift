import AVFoundation
import CoreGraphics
import CoreVideo
import Foundation
import ImageIO

guard CommandLine.arguments.count == 4 else {
    fputs("usage: frames-to-video.swift <frame-directory> <fps> <output.mp4>\n", stderr)
    exit(2)
}

let directory = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
guard let fps = Int32(CommandLine.arguments[2]), fps > 0 else {
    fputs("fps must be a positive integer\n", stderr)
    exit(2)
}
let output = URL(fileURLWithPath: CommandLine.arguments[3])
let files = try FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil)
    .filter { $0.lastPathComponent.range(of: #"^frame_[0-9]{4}\.(png|jpg)$"#, options: .regularExpression) != nil }
    .sorted { $0.lastPathComponent < $1.lastPathComponent }
guard let firstURL = files.first,
      let source = CGImageSourceCreateWithURL(firstURL as CFURL, nil),
      let first = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
    fputs("no readable frame images found in \(directory.path)\n", stderr)
    exit(2)
}

let width = first.width
let height = first.height
let writer = try AVAssetWriter(outputURL: output, fileType: .mp4)
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: 12_000_000,
        AVVideoExpectedSourceFrameRateKey: fps,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel
    ]
])
input.expectsMediaDataInRealTime = false
let attributes: [String: Any] = [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
    kCVPixelBufferWidthKey as String: width,
    kCVPixelBufferHeightKey as String: height,
    kCVPixelBufferCGImageCompatibilityKey as String: true,
    kCVPixelBufferCGBitmapContextCompatibilityKey as String: true
]
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: attributes)
guard writer.canAdd(input) else {
    fputs("AVAssetWriter cannot accept H.264 frames\n", stderr)
    exit(1)
}
writer.add(input)
guard writer.startWriting() else {
    throw writer.error ?? NSError(domain: "frames-to-video", code: 1, userInfo: [NSLocalizedDescriptionKey: "writer did not start"])
}
writer.startSession(atSourceTime: .zero)

let colorSpace = CGColorSpaceCreateDeviceRGB()
for (index, file) in files.enumerated() {
    while !input.isReadyForMoreMediaData {
        Thread.sleep(forTimeInterval: 0.005)
    }
    guard let src = CGImageSourceCreateWithURL(file as CFURL, nil),
          let image = CGImageSourceCreateImageAtIndex(src, 0, nil),
          image.width == width, image.height == height,
          let pool = adaptor.pixelBufferPool else {
        throw NSError(domain: "frames-to-video", code: 2, userInfo: [NSLocalizedDescriptionKey: "could not read \(file.lastPathComponent)"])
    }
    var pixelBuffer: CVPixelBuffer?
    CVPixelBufferPoolCreatePixelBuffer(kCFAllocatorDefault, pool, &pixelBuffer)
    guard let buffer = pixelBuffer else {
        throw NSError(domain: "frames-to-video", code: 3, userInfo: [NSLocalizedDescriptionKey: "could not allocate a video frame"])
    }
    CVPixelBufferLockBaseAddress(buffer, [])
    guard let context = CGContext(
        data: CVPixelBufferGetBaseAddress(buffer),
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else {
        CVPixelBufferUnlockBaseAddress(buffer, [])
        throw NSError(domain: "frames-to-video", code: 4, userInfo: [NSLocalizedDescriptionKey: "could not create a video frame context"])
    }
    context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
    CVPixelBufferUnlockBaseAddress(buffer, [])
    let time = CMTime(value: Int64(index), timescale: fps)
    guard adaptor.append(buffer, withPresentationTime: time) else {
        throw writer.error ?? NSError(domain: "frames-to-video", code: 5, userInfo: [NSLocalizedDescriptionKey: "could not append frame \(index)"])
    }
}

input.markAsFinished()
let finished = DispatchSemaphore(value: 0)
writer.finishWriting { finished.signal() }
finished.wait()
guard writer.status == .completed else {
    throw writer.error ?? NSError(domain: "frames-to-video", code: 6, userInfo: [NSLocalizedDescriptionKey: "video encoding failed"])
}
print("encoded \(files.count) frames at \(fps) fps -> \(output.path)")
