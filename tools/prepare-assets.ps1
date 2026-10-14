Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$piecesDir = Join-Path $root "pieces"
$thumbDir = Join-Path $root "assets\thumbs"
$spriteDir = Join-Path $root "assets\sprites"

New-Item -ItemType Directory -Force -Path $thumbDir | Out-Null
New-Item -ItemType Directory -Force -Path $spriteDir | Out-Null

function Convert-ToThumb {
    param(
        [string]$InputPath,
        [string]$OutputPath,
        [int]$MaxEdge = 1000,
        [int]$Quality = 88
    )

    $source = [System.Drawing.Image]::FromFile($InputPath)

    try {
        $scale = [Math]::Min(1.0, [Math]::Min($MaxEdge / $source.Width, $MaxEdge / $source.Height))
        $width = [int][Math]::Round($source.Width * $scale)
        $height = [int][Math]::Round($source.Height * $scale)

        $canvas = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
        $graphics = [System.Drawing.Graphics]::FromImage($canvas)

        try {
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
            $graphics.Clear([System.Drawing.Color]::White)
            $graphics.DrawImage($source, 0, 0, $width, $height)
        } finally {
            $graphics.Dispose()
        }

        $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
        $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]$Quality)

        try {
            $canvas.Save($OutputPath, $codec, $encoderParams)
        } finally {
            $encoderParams.Dispose()
            $canvas.Dispose()
        }

        return "$([System.IO.Path]::GetFileName($OutputPath)) ${width}x${height}"
    } finally {
        $source.Dispose()
    }
}

function Convert-ToCleanSprite {
    param(
        [string]$InputPath,
        [string]$OutputPath,
        [int]$SoftEdge = 238
    )

    $source = New-Object System.Drawing.Bitmap($InputPath)

    try {
        $minX = $source.Width
        $minY = $source.Height
        $maxX = -1
        $maxY = -1

        for ($y = 0; $y -lt $source.Height; $y++) {
            for ($x = 0; $x -lt $source.Width; $x++) {
                $pixel = $source.GetPixel($x, $y)
                $luminance = (0.299 * $pixel.R) + (0.587 * $pixel.G) + (0.114 * $pixel.B)

                if ($luminance -ge $SoftEdge) {
                    $alphaFraction = [Math]::Max(0.0, [Math]::Min(1.0, (255.0 - $luminance) / (255.0 - $SoftEdge)))
                    $alpha = [int][Math]::Round(255 * $alphaFraction * $alphaFraction)
                    $source.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B))
                }

                if ($source.GetPixel($x, $y).A -gt 12) {
                    if ($x -lt $minX) { $minX = $x }
                    if ($y -lt $minY) { $minY = $y }
                    if ($x -gt $maxX) { $maxX = $x }
                    if ($y -gt $maxY) { $maxY = $y }
                }
            }
        }

        if ($maxX -lt 0) {
            $minX = 0; $minY = 0; $maxX = $source.Width - 1; $maxY = $source.Height - 1
        }

        $padding = 4
        $minX = [Math]::Max(0, $minX - $padding)
        $minY = [Math]::Max(0, $minY - $padding)
        $maxX = [Math]::Min($source.Width - 1, $maxX + $padding)
        $maxY = [Math]::Min($source.Height - 1, $maxY + $padding)

        $cropWidth = $maxX - $minX + 1
        $cropHeight = $maxY - $minY + 1

        $targetHeight = 440
        $scale = $targetHeight / $cropHeight
        $outWidth = [int][Math]::Round($cropWidth * $scale)
        $outHeight = $targetHeight

        $canvas = New-Object System.Drawing.Bitmap($outWidth, $outHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $graphics = [System.Drawing.Graphics]::FromImage($canvas)

        try {
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
            $graphics.Clear([System.Drawing.Color]::Transparent)
            $cropRect = New-Object System.Drawing.Rectangle($minX, $minY, $cropWidth, $cropHeight)
            $destRect = New-Object System.Drawing.Rectangle(0, 0, $outWidth, $outHeight)
            $graphics.DrawImage($source, $destRect, $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
        } finally {
            $graphics.Dispose()
        }

        try {
            $canvas.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally {
            $canvas.Dispose()
        }

        return "$([System.IO.Path]::GetFileName($OutputPath)) ${outWidth}x${outHeight}"
    } finally {
        $source.Dispose()
    }
}

"--- gallery thumbnails ---"
Get-ChildItem -Path $piecesDir -Filter *.png | Sort-Object Name | ForEach-Object {
    $target = Join-Path $thumbDir ($_.BaseName + ".jpg")
    Convert-ToThumb -InputPath $_.FullName -OutputPath $target
}

"--- starter sprites ---"
@("Quaxly", "fuecoco", "sprigatito") | ForEach-Object {
    $input = Join-Path $piecesDir ($_ + ".png")
    $target = Join-Path $spriteDir ($_ + ".png")
    Convert-ToCleanSprite -InputPath $input -OutputPath $target
}

"--- done ---"
