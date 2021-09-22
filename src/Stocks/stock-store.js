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
    updateStock: (updatedStock) => {
        stocks.update(items => {
            return items.find(stock => stock.stockName === updatedStock.stockName);
        })
    }
}

export default customStockStore;