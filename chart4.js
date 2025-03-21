document.addEventListener("DOMContentLoaded", function () {
    d3.csv("data_ggsheet.csv").then(data => {
        if (!data || data.length === 0) {
            console.error("Dữ liệu chưa được load hoặc rỗng!");
            return;
        }

        console.log("Dữ liệu đã load:", data);

        const margin = { top: 40, right: 50, bottom: 50, left: 80 },
            width = 1200,
            height = 700;

        data.forEach(d => {
            d["Thành tiền"] = +d["Thành tiền"] || 0;
            d["SL"] = +d["SL"] || 0;
            d["Thời gian tạo đơn"] = d3.timeParse("%Y-%m-%d %H:%M:%S")(d["Thời gian tạo đơn"]);
        });

        const getWeekday = date => ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"][date.getDay()];

        const dayData = data.map(d => ({
            "Ngày tạo đơn": d3.timeFormat("%Y-%m-%d")(d["Thời gian tạo đơn"]),
            "Thứ": getWeekday(d["Thời gian tạo đơn"]),
            "Thành tiền": d["Thành tiền"],
            "SL": d["SL"]
        }));

        const aggregatedData = d3.rollups(
            dayData,
            v => ({
                "Thành tiền": d3.sum(v, d => d["Thành tiền"]),
                "SL": d3.sum(v, d => d["SL"]),
                "Ngày tạo đơn": [...new Set(v.map(d => d["Ngày tạo đơn"]))]
            }),
            d => d["Thứ"]
        ).map(([key, obj]) => ({
            "Thứ": key,
            "Thành tiền": obj["Thành tiền"],
            "SL": obj["SL"],
            "Doanh số bán TB": obj["Thành tiền"] / obj["Ngày tạo đơn"].length,
            "Số lượng bán TB": obj["SL"] / obj["Ngày tạo đơn"].length
        }));

        const weekdaysOrder = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
        aggregatedData.sort((a, b) => weekdaysOrder.indexOf(a["Thứ"]) - weekdaysOrder.indexOf(b["Thứ"]));

        const svg = d3.select("#chart4")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const x = d3.scaleBand()
            .domain(aggregatedData.map(d => d["Thứ"]))
            .range([margin.left, width - margin.right])
            .padding(0.3);

        const y = d3.scaleLinear()
            .domain([0, d3.max(aggregatedData, d => d["Doanh số bán TB"]) * 1.2])
            .nice()
            .range([height - margin.bottom, margin.top]);

        const colorScale = d3.scaleOrdinal(d3.schemePastel1);

        svg.selectAll(".bar")
            .data(aggregatedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d["Thứ"]))
            .attr("y", d => y(d["Doanh số bán TB"]))
            .attr("width", x.bandwidth())
            .attr("height", d => height - margin.bottom - y(d["Doanh số bán TB"]))
            .attr("fill", d => colorScale(d["Thứ"]));

        svg.selectAll(".label")
            .data(aggregatedData)
            .enter()
            .append("text")
            .attr("x", d => x(d["Thứ"]) + x.bandwidth() / 2)
            .attr("y", d => y(d["Doanh số bán TB"]) - 10)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("fill", "black")
            .text(d => `${Math.round(d["Doanh số bán TB"] )} triệu VNĐ`);

        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x))
            .style("font-size", "11px");

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).tickFormat(d => `${(d / 1e6).toFixed(0)}M`).ticks(8))
            .style("font-size", "11px");

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "18px")
            .attr("fill", "#337ab7")
            .text("Doanh số bán hàng trung bình theo Thứ trong tuần");
    }).catch(error => console.error("Lỗi tải dữ liệu:", error));
});