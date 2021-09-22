<script>
	import StockList from "./Stocks/StockList.svelte";
	import stocks from "./Stocks/stock-store";

	let apiKey = "c556jkqad3iak9epgvr0";
	let apiToken = "&token=" + apiKey;

	let finnHubURL = "https://finnhub.io/api/v1/";
	let searchInput = "";

	function getStock() {
		let stockToAdd = {};

		fetch(finnHubURL + "search?q=" + searchInput + apiToken)
			.then((res) => {
				return res.json();
			})
			.then((data) => {
				let firstResult = data.result[0];
				let name = firstResult.description;
				let symbol = firstResult.symbol;

				stockToAdd.stockName = name;
				stockToAdd.tickerSymbol = symbol;

				return fetch(finnHubURL + "/quote?symbol=" + symbol + apiToken);
			})
			.then((res) => {
				return res.json();
			})
			.then((data) => {
				stockToAdd.price = data.c;
				stockToAdd.dp = data.dp;
				stockToAdd.change = data.d;

				stocks.addStock(stockToAdd);
			})
			.catch((err) => {
				console.log(err);
			});
	}

	function updateStock(tickerSymbol) {
		let stockToUpdate = {};
		fetch(finnHubURL + "/quote?symbol=" + tickerSymbol + apiToken)
			.then((res) => {
				return res.json();
			})
			.then((data) => {
				stockToUpdate.price = data.c;
				stockToUpdate.dp = data.dp;
				stockToUpdate.change = data.d;
				stocks.updateStock(stockToUpdate);
			})
			.catch((err) => {
				console.log(err);
			});
	}

	function delStock(event) {
		console.log(event.detail);
		stocks.deleteStock(event.detail);
	}

	// https://finnhub.io/api/v1/webhook/
</script>

<main>
	<h1>Stock Tracker</h1>
	<input type="text" bind:value={searchInput} />
	<button on:click={getStock}>Submit</button>
	<p>Search Input: {searchInput}</p>
	<StockList stocks={$stocks} on:delete={delStock} />
</main>

<style>
</style>
