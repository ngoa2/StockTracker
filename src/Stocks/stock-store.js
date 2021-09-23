import { writable } from "svelte/store";

let stocks = writable([{ stockName: "Test-la", tickerSymbol: "TEST", price: 999, change: 100, dp: .05 }]);

const customStockStore = {
    subscribe: stocks.subscribe,
    addStock: (stock) => {
        const newStock = {
            ...stock,
            id: Math.random().toString()
        }
        stocks.update(items => {
            return [...items, newStock]
        })

    },
    deleteStock: (stockName) => {
        stocks.update(items => {
            return items.filter(stock => stock.stockName !== stockName);
        })
    },
    updateStock: (stockData, tickerSymbol) => {
        stocks.update(items => {
            const stockIndex = items.findIndex(i => i.tickerSymbol === tickerSymbol);
            const updatedStock = { ...items[stockIndex], ...stockData };
            const updatedStockArr = [...items];
            updatedStockArr[stockIndex] = updatedStock;
            return updatedStockArr;
        })
    }
}

export default customStockStore;
