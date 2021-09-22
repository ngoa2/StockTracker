<script>
    import StockItem from "./StockItem.svelte";
    export let stocks;
</script>

<section>
    {#each stocks as stock}
        <StockItem
            stockName={stock.stockName}
            tickerSymbol={stock.tickerSymbol}
        />
    {/each}
</section>

<style>
    section {
        display: flex;
        flex: 1;
        flex-direction: column;
        width: 100%;
        margin: 1rem;
    }
</style>
