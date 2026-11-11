$screens = @(
    @{ name = "01-overview"; url = "http://localhost:5173/?view=overview" },
    @{ name = "02-sky"; url = "http://localhost:5173/?view=sky" },
    @{ name = "05-tonight"; url = "http://localhost:5173/?view=tonight" },
    @{ name = "06-constellations-catalog"; url = "http://localhost:5173/?view=constellations" },
    @{ name = "07-trace-workspace"; url = "http://localhost:5173/?view=sky&trace=1" },
    @{ name = "08-recognition-results"; url = "http://localhost:5173/?view=sky&results=1" },
    @{ name = "09-pattern-analysis"; url = "http://localhost:5173/?view=sky&analysis=1" },
    @{ name = "10-automata-lab"; url = "http://localhost:5173/?view=automataLab" },
    @{ name = "11-imagelab"; url = "http://localhost:5173/?view=imageLab" },
    @{ name = "12-constellation-detail-orion"; url = "http://localhost:5173/?view=constellations&constellation=Ori" }
)

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$outDir = "C:\ommd3076\Proejcts\automata-theory\work\evidence"

if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir
}

foreach ($s in $screens) {
    $outFile = Join-Path $outDir "$($s.name).png"
    Write-Host "Capturing $($s.name) from $($s.url) -> $outFile"
    $args = @(
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--window-size=1586,992",
        "--screenshot=$outFile",
        $s.url
    )
    Start-Process -FilePath $edgePath -ArgumentList $args -Wait
    if (Test-Path $outFile) {
        $item = Get-Item $outFile
        Write-Host "SUCCESS: $($s.name) created ($($item.Length) bytes)"
    } else {
        Write-Host "FAILED: $($s.name) not found"
    }
}
