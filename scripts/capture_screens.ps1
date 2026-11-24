$screens = @(
    @{ name = "01-overview"; query = "?view=overview" },
    @{ name = "02-sky"; query = "?view=sky" },
    @{ name = "03-tonight"; query = "?view=tonight" },
    @{ name = "04-constellations-catalog"; query = "?view=constellations" },
    @{ name = "05-trace-workspace"; query = "?view=sky&trace=1" },
    @{ name = "06-recognition-results"; query = "?view=results&results=1" },
    @{ name = "07-pattern-analysis"; query = "?view=patterns&analysis=1" },
    @{ name = "08-automata-lab"; query = "?view=automataLab" },
    @{ name = "09-image-lab"; query = "?view=imageLab" },
    @{ name = "10-hunt-mode"; query = "?view=hunt" },
    @{ name = "11-viva-mode"; query = "?view=academic" },
    @{ name = "12-credits"; query = "?view=credits" }
)

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$baseUrl = if ($env:COSTELLAR_BASE_URL) { $env:COSTELLAR_BASE_URL.TrimEnd('/') } else { "http://localhost:5319" }
$outputRoot = if ($env:COSTELLAR_EVIDENCE_DIR) { $env:COSTELLAR_EVIDENCE_DIR } else { Join-Path $env:TEMP "costellar-evidence" }
$runId = Get-Date -Format "yyyyMMdd-HHmmss-fff"
$outDir = Join-Path $outputRoot "screens-$runId"

if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir
}

foreach ($s in $screens) {
    $outFile = Join-Path $outDir "$($s.name).png"
    $url = "$baseUrl/$($s.query)"
    Write-Host "Capturing $($s.name) from $url -> $outFile"
    $args = @(
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--window-size=1586,992",
        "--user-data-dir=$(Join-Path $env:TEMP "costellar-shot-$runId-$($s.name)")",
        "--force-device-scale-factor=1",
        "--screenshot=$outFile",
        $url
    )
    Start-Process -FilePath $edgePath -ArgumentList $args -Wait
    if (Test-Path $outFile) {
        $item = Get-Item $outFile
        Write-Host "SUCCESS: $($s.name) created ($($item.Length) bytes)"
    } else {
        Write-Host "FAILED: $($s.name) not found"
    }
}
