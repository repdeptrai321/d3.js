document.addEventListener("DOMContentLoaded", function () {
    d3.csv("data_ggsheet.csv").then(data => {
        if (!data || data.length === 0) {
            console.error("Dữ liệu chưa được load hoặc rỗng!");
            return;
        }

        console.log("Dữ liệu đã load:", data);

        const margin = { top: 40, right: 40, bottom: 50, left: 50 },
            width = 1000,
            height = 350;

        // Chuyển đổi dữ liệu
        data.forEach(d => {
            d["Thành tiền"] = isNaN(+d["Thành tiền"]) ? 0 : +d["Thành tiền"];
            d["SL"] = isNaN(+d["SL"]) ? 0 : +d["SL"];
            d["Thời gian tạo đơn"] = d3.timeParse("%Y-%m-%d %H:%M:%S")(d["Thời gian tạo đơn"]);
        });

        const dayData = data.map(d => ({
            "Ngày tạo đơn": d3.timeFormat("%Y-%m-%d")(d["Thời gian tạo đơn"]),
            "Ngày trong tháng": `Ngày ${d["Thời gian tạo đơn"].getDate().toString().padStart(2, '0')}`,
            "Thành tiền": d["Thành tiền"],
            "SL": d["SL"]
        }));

        // Tổng hợp dữ liệu
        const aggregatedData = Array.from(
            d3.group(dayData, d => d["Ngày trong tháng"]),
            ([key, values]) => ({
                "Ngày trong tháng": key,
                "Thành tiền": d3.sum(values, d => d["Thành tiền"]),
                "SL": d3.sum(values, d => d["SL"]),
                "Ngày tạo đơn": [...new Set(values.map(d => d["Ngày tạo đơn"]))]
            })
        ).map(d => ({
            ...d,
            "Doanh số bán TB": d["Thành tiền"] / d["Ngày tạo đơn"].length,
            "Số lượng bán TB": d["SL"] / d["Ngày tạo đơn"].length
        }));

        aggregatedData.sort((a, b) => parseInt(a["Ngày trong tháng"].split(' ')[1]) - parseInt(b["Ngày trong tháng"].split(' ')[1]));

        const svg = d3.select("#chart5")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .domain(aggregatedData.map(d => d["Ngày trong tháng"]))
            .range([0, width])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(aggregatedData, d => d["Doanh số bán TB"] * 1.2)])
            .nice()
            .range([height, 0]);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        chart.selectAll(".bar")
            .data(aggregatedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d["Ngày trong tháng"]))
            .attr("y", height)
            .attr("width", x.bandwidth())
            .attr("height", 0)
            .attr("fill", d => colorScale(d["Ngày trong tháng"]))
            .transition()
            .duration(800)
            .attr("y", d => y(d["Doanh số bán TB"]))
            .attr("height", d => height - y(d["Doanh số bán TB"]));

        chart.selectAll(".label")
            .data(aggregatedData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d["Ngày trong tháng"]) + x.bandwidth() / 2)
            .attr("y", height - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "12px") // Điều chỉnh kích thước của label
            .text(d => `${(d["Doanh số bán TB"] / 1_000_000).toFixed(1)} tr`)
            .transition()
            .duration(800)
            .attr("y", d => y(d["Doanh số bán TB"]) - 5);

        chart.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .style("font-size", "11px")
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        chart.append("g")
            .call(d3.axisLeft(y).tickFormat(d => `${(d / 1_000_000).toFixed(0)}M`).ticks(10))
            .style("font-size", "11px");
            svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "18px")
            .attr("fill", "#337ab7")
            .text("Doanh số bán hàng trung bình theo Ngày trong tháng");
    }).catch(error => console.error("Lỗi tải dữ liệu:", error));
});
