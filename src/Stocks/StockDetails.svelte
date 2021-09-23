<script>
    import { CrosshairMode } from "lightweight-charts";
    import Chart from "svelte-lightweight-charts/components/chart.svelte";
    import CandlestickSeries from "svelte-lightweight-charts/components/candlestick-series.svelte";
    export let stockData;

    const options = {
        width: 500,
        height: 300,
        layout: {
            backgroundColor: "#000000",
            textColor: "rgba(255, 255, 255, 0.9)",
        },
        grid: {
            vertLines: {
                color: "rgba(197, 203, 206, 0.5)",
            },
            horzLines: {
                color: "rgba(197, 203, 206, 0.5)",
            },
        },
        crosshair: {
            mode: CrosshairMode.Normal,
        },
        rightPriceScale: {
            borderColor: "rgba(197, 203, 206, 0.8)",
        },
        timeScale: {
            borderColor: "rgba(197, 203, 206, 0.8)",
        },
    };
    let data = [];

    for (let i = 0; i < 50; i++) {
        data.push({
            time: timeConverter(stockData.t[i]),
            open: stockData.o[i],
            high: stockData.h[i],
            low: stockData.l[i],
            close: stockData.c[i],
        });
    }
    // const data = [
    //     {
    //         time: "2018-10-19",
    //         open: 180.34,
    //         high: 180.99,
    //         low: 178.57,
    //         close: 179.85,
    //     },
    //     {
    //         time: "2018-10-22",
    //         open: 180.82,
    //         high: 181.4,
    //         low: 177.56,
    //         close: 178.75,
    //     },
    // ];

    //1569297600
    function timeConverter(UNIX_timestamp) {
        var a = new Date(UNIX_timestamp * 1000);
        var year = a.getFullYear();
        var month = a.getMonth() + "";
        if (month.length < 2) {
            month = "0" + month;
        }
        var date = a.getDate() + "";
        if (date.length < 2) {
            date = "0" + date;
        }
        var time = year + "-" + month + "-" + date;
        return time;
    }
</script>

<h1>Candlestick Chart</h1>
<Chart {...options}>
    <CandlestickSeries
        {data}
        upColor="rgba(255, 144, 0, 1)"
        downColor="#000"
        borderDownColor="rgba(255, 144, 0, 1)"
        borderUpColor="rgba(255, 144, 0, 1)"
        wickDownColor="rgba(255, 144, 0, 1)"
        wickUpColor="rgba(255, 144, 0, 1)"
    />
</Chart>
