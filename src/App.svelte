<script>
	import StockList from "./Stocks/StockList.svelte";
	let apiKey = "c556jkqad3iak9epgvr0";
	let apiToken = "&token=" + apiKey;

	let finnHubURL = "https://finnhub.io/api/v1/";
	let searchInput = "";
	let stocks = [
		{ stockName: "Apple", tickerSymbol: "APPL" },
		{ stockName: "Apple", tickerSymbol: "APPL" },
	];
	function addStock() {
		stocks = [...stocks, searchInput];
	}

	function getStock() {
		fetch(finnHubURL + "search?q=apple" + apiToken)
			.then((res) => {
				return res.json();
			})
			.then((data) => {
				console.log(data);
				let firstResult = data.result[0];
				stocks;
				console.log(firstResult.description);
				console.log(firstResult.symbol);
			})
			.catch((err) => {
				console.log(err);
			});
	}

	// https://finnhub.io/api/v1/webhook/
</script>

<main>
	<h1>Stock Tracker</h1>
	<input type="text" bind:value={searchInput} />
	<button on:click={addStock}>Submit</button>
	<button on:click={getStock}>Get Apple</button>
	<p>Search Input: {searchInput}</p>
	<StockList {stocks} />
</main>

<style>
	@import url("https://fonts.googleapis.com/css2?family=Open+Sans:wght@300&display=swap");
</style>
