<template>
    <div id="app">
        <pivot-table
            :show-row-summary="true"
            :show-column-summary="true"
            :all-row-summary-handle="handleAllRowSummary"
            :all-column-summary-handle="handleAllColumnSummary"
            :rows="rows"
            :columns="columns"
            :values="values"
            :data="tableData"
        ></pivot-table>
    </div>
</template>

<script>
import PivotTable from "./components/PivotTable";
import DEMODATA from "./components/PivotTable/mock/data";

export default {
    name: "App",
    data: () => ({
        rows: [
            {
                key: "date",
                label: "Date"
            },
            {
                key: "time",
                label: "Time"
            }
        ],
        columns: [
            {
                key: "media",
                label: "Media"
            },
            {
                key: "account",
                label: "Account"
            },
            {
                key: "proxy",
                label: "Proxy"
            }
        ],
        values: [
            {
                key: "click",
                label: "Clicks",
                handle(data) {
                    if (!data.length) return "";
                    let total = 0;
                    data.forEach(item => {
                        total += item.click;
                    });
                    return total;
                }
            },
            {
                key: "download",
                label: "Downloads",
                handle(data) {
                    // console.log(data);
                    if (!data.length) return "";
                    let total = 0;
                    data.forEach(item => {
                        total += item.download;
                    });
                    return total;
                }
            }
        ],
        tableData: DEMODATA
    }),
    components: {
        PivotTable
    },
    methods: {
        handleAllRowSummary(data) {
            const sum = data.reduce((prev, curr) => prev + curr);
            return parseFloat((sum / data.length).toFixed(2));
        },
        handleAllColumnSummary(data) {
            const { click, download } = data;
            return parseFloat((click / download).toFixed(2));
        }
    }
};
</script>

<style lang="scss">
* {
    margin: 0;
    padding: 0;
}
</style>