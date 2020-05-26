<template>
    <div id="app">
        <pivot-table :rows="rows" :columns="columns" :values="values" :data="tableData"></pivot-table>
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
                label: "日期"
            },
            {
                key: "time",
                label: "时间"
            }
        ],
        columns: [
            {
                key: "media",
                label: "媒体"
            },
            {
                key: "account",
                label: "账号"
            },
            {
                key: "proxy",
                label: "代理"
            }
        ],
        values: [
            {
                key: "click",
                label: "点击求和",
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
                label: "应用下载",
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
    }
};
</script>

<style lang="scss">
* {
    margin: 0;
    padding: 0;
}
</style>
