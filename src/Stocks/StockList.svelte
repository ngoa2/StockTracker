<script>
    import StockItem from "./StockItem.svelte";
    export let stocks;
</script>

<section>
    {#each stocks as stock}
        <StockItem
            stockName={stock.stockName}
            tickerSymbol={stock.tickerSymbol}
            price={stock.price}
            dp={stock.dp}
            change={stock.change}
            on:delete
            on:update
        />
    {/each}
</section>

<style>
    section {
        display: flex;
        flex: 1;
        flex-direction: column;
        width: 100%;
    }
</style>
