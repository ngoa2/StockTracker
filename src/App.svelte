<script>
	import StockList from "./Stocks/StockList.svelte";
	import stocks from "./Stocks/stock-store";
	import Header from "./Components/Header.svelte";

	let apiKey = "c556jkqad3iak9epgvr0";
	let apiToken = `&token=${apiKey}`;

	let finnHubURL = "https://finnhub.io/api/v1/";
	let searchInput = "";

	async function getStock() {
		try {
			const tickerSearchResponse = await fetch(
				`${finnHubURL}search?q=${searchInput}${apiToken}`
			);

			const firstResultJson = await tickerSearchResponse.json();
			const { description, symbol } = firstResultJson.result[0];

			const stockQuoteResponse = await fetch(
				`${finnHubURL}/quote?symbol=${symbol}${apiToken}`
			);

			const stockQuoteJson = await stockQuoteResponse.json();

			const stockToAdd = {
				stockName: description,
				tickerSymbol: symbol,
				price: stockQuoteJson.c,
				dp: stockQuoteJson.dp,
				change: stockQuoteJson.d,
			};

			stocks.addStock(stockToAdd);
		} catch (err) {
			console.log(`App::getStock error: ${err}`);
		}
	}

	async function updateStock(event) {
		let tickerSymbol = event.detail;

		try {
			const stockQuoteResponse = await fetch(
				`${finnHubURL}/quote?symbol=${tickerSymbol}${apiToken}`
			);

			const stockQuoteJson = await stockQuoteResponse.json();
			const stockData = {
				price: stockQuoteJson.c,
				dp: stockQuoteJson.dp,
				change: stockQuoteJson.d,
			};
			console.log(stockData);

			stocks.updateStock(stockData, tickerSymbol);
		} catch (err) {
			console.log(`App::updateStock error: ${err}`);
		}
	}

	function delStock(event) {
		stocks.deleteStock(event.detail);
	}
</script>

<main>
	<Header caption="Stock Tracker" />
	<h2>Instructions:</h2>
	<p>
		Search for a stock by using the searchbar below, and hit submit to get
		an up to date quote on it.
	</p>

	<input type="text" placeholder="Search" bind:value={searchInput} />
	<button on:click={getStock}>Submit</button>

	<section>
		<StockList
			stocks={$stocks}
			on:delete={delStock}
			on:update={updateStock}
		/>
	</section>
</main>

<style>
	main {
		margin: 5rem;
	}

	section {
		margin-right: 5rem;
		margin-top: 2rem;
	}

	button {
		background-color: lightskyblue;
		color: white;
		border-radius: 5px;
	}
</style>
