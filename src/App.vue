<template>
    <div id="app">
        <pivot-table
            :row-summary="rowSummarys"
            :column-summary="columnSummarys"
            :rows="rows"
            :columns="columns"
            :values="values"
            :data="tableData"
            @on-change="handleChange"
            @on-dragend="handleDragEnd"
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
                label: "Date",
                // values: ["2020-06-04", "2020-06-05"]
            },
            {
                key: "time",
                label: "Time",
                // values: ["01:00", "02:00"]
            },
        ],
        columns: [
            {
                key: "media",
                label: "Media",
                // values: ["媒体1", "媒体2"]
            },
            {
                key: "account",
                label: "Account",
                // values: ["账号1", "账号2"]
            },
            {
                key: "proxy",
                label: "Proxy",
                // values: ["代理1", "代理2"]
            },
        ],
        values: [
            {
                key: "click",
                label: "Clicks",
                handle(data) {
                    if (!data.length) return "";
                    let total = 0;
                    data.forEach((item) => {
                        total += item.click;
                    });
                    return total;
                },
            },
            {
                key: "download",
                label: "Downloads",
                handle(data) {
                    if (!data.length) return "";
                    let total = 0;
                    data.forEach((item) => {
                        total += item.download;
                    });
                    return total;
                },
            },
        ],
        rowSummarys: [
            {
                label: "新增行",
                handle(data) {
                    if (!data.length) return "";
                    return data
                        .filter((num) => num !== "")
                        .reduce((prev, curr) => prev + curr, 0);
                },
            },
        ],
        columnSummarys: [
            {
                label: "新增列",
                handle(data) {
                    let clicks = 0;
                    let downloads = 0;

                    data.forEach(({ click, download }) => {
                        clicks += +click;
                        downloads += +download;
                    });

                    const result = clicks / downloads;

                    return Number.isNaN(result)
                        ? ""
                        : (result * 100).toFixed(2) + "%";
                },
            },
            {
                label: "新增列1",
                handle(data) {
                    let clicks = 0;
                    let downloads = 0;

                    data.forEach(({ click, download }) => {
                        clicks += +click;
                        downloads += +download;
                    });

                    const result = clicks + downloads;

                    return Number.isNaN(result) ? "" : result;
                },
            },
        ],
        tableData: DEMODATA,
    }),
    components: {
        PivotTable,
    },
    // mounted() {
    //     setTimeout(() => {
    //         this.columns = [];
    //     }, 1000);
    // },
    methods: {
        handleAllRowSummary(data) {
            const sum = data.reduce((prev, curr) => prev + curr);
            return parseFloat((sum / data.length).toFixed(2));
        },
        handleAllColumnSummary(data) {
            const { click, download } = data;
            return parseFloat((click / download).toFixed(2));
        },
        handleChange() {
            console.log("change");
        },
        handleDragEnd(data, allData) {
            console.log("drag end", data, allData);
        },
    },
};
</script>

<style lang="scss">
* {
    margin: 0;
    padding: 0;
}
</style>
