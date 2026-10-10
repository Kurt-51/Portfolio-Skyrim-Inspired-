$port = 5173
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Start()
Write-Host "HTTP Server listening on http://localhost:$port/ and http://127.0.0.1:$port/"

$root = $PSScriptRoot

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8";
    ".css"  = "text/css; charset=utf-8";
    ".js"   = "application/javascript; charset=utf-8";
    ".json" = "application/json; charset=utf-8";
    ".png"  = "image/png";
    ".jpg"  = "image/jpeg";
    ".jpeg" = "image/jpeg";
    ".gif"  = "image/gif";
    ".svg"  = "image/svg+xml";
    ".glb"  = "model/gltf-binary";
    ".gltf" = "model/gltf+json";
    ".ico"  = "image/x-icon";
    ".woff2"= "font/woff2";
    ".zip"  = "application/zip";
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        try {
            $request = $context.Request
            $response = $context.Response

            $path = $request.Url.LocalPath
            if ($path -eq "/" -or $path -eq "") {
                $path = "/index.html"
            }

            # Handle URL decode
            $relPath = [System.Uri]::UnescapeDataString($path.TrimStart('/'))
            $relPath = $relPath.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
            $fullPath = [System.IO.Path]::Combine($root, $relPath)

            if ([System.IO.File]::Exists($fullPath)) {
                $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
                $mime = $mimeTypes[$ext]
                if (-not $mime) { $mime = "application/octet-stream" }
                $response.ContentType = $mime
                
                # CORS headers
                $response.AddHeader("Access-Control-Allow-Origin", "*")
                $response.AddHeader("Cache-Control", "no-cache")

                $bytes = [System.IO.File]::ReadAllBytes($fullPath)
                $response.ContentLength64 = $bytes.Length
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            } else {
                $response.StatusCode = 404
                $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
                $response.ContentType = "text/plain; charset=utf-8"
                $response.ContentLength64 = $msg.Length
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($msg, 0, $msg.Length)
                }
            }
        } catch {
            Write-Warning "Error processing request: $_"
        } finally {
            try { $context.Response.Close() } catch {}
        }
    }
} finally {
    try { $listener.Stop() } catch {}
}
