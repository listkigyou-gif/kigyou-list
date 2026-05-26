# Script khởi chạy 5 luồng cào Yahoo song song
$ports = @(40001, 40002, 40003, 40004, 40005)

foreach ($i in 1..5) {
    $port = $ports[$i-1]
    $input = "data/parts/part_$i.csv"
    $output = "data/results_$port.csv"
    $log = "logs/crawler_$port.log"
    
    Write-Host "Starting crawler on port $port for $input..."
    
    # Tạo thư mục logs nếu chưa có
    if (!(Test-Path "logs")) { New-Item -ItemType Directory -Path "logs" }

    Start-Process python -ArgumentList "yahoo_searcher.py --input $input --output $output --proxy-port $port --log-file $log --headless" -WindowStyle Hidden
}

Write-Host "All 5 crawlers started in background!"
