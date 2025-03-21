document.addEventListener("DOMContentLoaded", function () {
    d3.csv("data_ggsheet.csv").then(data => {
        if (!data || data.length === 0) {
            console.error("Dữ liệu chưa được load hoặc rỗng!");
            return;
        }

        console.log("Dữ liệu đã load:", data);

        const margin = { top: 40, right: 40, bottom: 100, left: 50 },
            width = 1100,
            height = 350;

        // Chuyển đổi dữ liệu
        data.forEach(d => {
            d["Thành tiền"] = isNaN(+d["Thành tiền"]) ? 0 : +d["Thành tiền"];
            d["SL"] = isNaN(+d["SL"]) ? 0 : +d["SL"];
            d["Thời gian tạo đơn"] = d3.timeParse("%Y-%m-%d %H:%M:%S")(d["Thời gian tạo đơn"]);
        });

        // Tạo cột Khung giờ
        const hourData = data.map(d => ({
            "Khung giờ": `${d["Thời gian tạo đơn"].getHours().toString().padStart(2, '0')}:00-${d["Thời gian tạo đơn"].getHours().toString().padStart(2, '0')}:59`,
            "Ngày tạo đơn": d3.timeFormat("%Y-%m-%d")(d["Thời gian tạo đơn"]),
            "Thành tiền": d["Thành tiền"],
            "SL": d["SL"]
        }));

        // Tổng hợp dữ liệu theo Khung giờ
        const aggregatedData = Array.from(
            d3.group(hourData, d => d["Khung giờ"]),
            ([key, values]) => ({
                "Khung giờ": key,
                "Thành tiền": d3.sum(values, d => d["Thành tiền"]),
                "SL": d3.sum(values, d => d["SL"]),
                "Ngày tạo đơn": [...new Set(values.map(d => d["Ngày tạo đơn"]))].length
            })
        ).map(d => ({
            ...d,
            "Doanh số bán TB": Math.round(d["Thành tiền"] / d["Ngày tạo đơn"]),
            "Số lượng bán TB": d["SL"]
        }));

        // Sắp xếp dữ liệu theo Khung giờ
        aggregatedData.sort((a, b) => parseInt(a["Khung giờ"].split(':')[0]) - parseInt(b["Khung giờ"].split(':')[0]));

        // Tạo SVG
        const svg = d3.select("#chart6")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Thang đo
        const x = d3.scaleBand()
            .domain(aggregatedData.map(d => d["Khung giờ"]))
            .range([0, width])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, 900_000])
            .range([height, 0]);

        // Tạo màu sắc cho các khung giờ
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // Vẽ cột
        const bars = chart.selectAll(".bar")
            .data(aggregatedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d["Khung giờ"]))
            .attr("y", d => y(d["Doanh số bán TB"]))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d["Doanh số bán TB"]))
            .attr("fill", d => colorScale(d["Khung giờ"]))
            .on("mouseover", function (event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`
                    <p><strong>Khung giờ: ${d["Khung giờ"]}</strong></p>
                    <p><strong>Doanh số bán TB:</strong> ${Math.round(d["Doanh số bán TB"]).toLocaleString()} VND</p>
                    <p><strong>Số lượng bán TB:</strong> ${Math.round(d["Số lượng bán TB"]).toLocaleString()} SKUs</p>
                `)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px")
                    .style("font-size", "11px");
            })
            .on("mouseout", function () {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("click", function (event, d) {
                if (d3.select(this).attr("opacity") !== "0.3") {
                    bars.attr("opacity", 0.3);
                    d3.select(this).attr("opacity", 1);
                } else {
                    bars.attr("opacity", 1);
                }
            });

        // Nhãn số liệu trên cột
        chart.selectAll(".label")
            .data(aggregatedData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d["Khung giờ"]) + x.bandwidth() / 2)
            .attr("y", d => y(d["Doanh số bán TB"]) - 5)
            .attr("text-anchor", "middle")
            .text(d => `${Math.round(d["Doanh số bán TB"]).toLocaleString()} VND`)
            .style("font-size", "10px");

        // Trục X
        chart.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .style("font-size", "12px")
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.8em")
            .attr("dy", "0.15em")
            .attr("transform", "rotate(-45)");

        // Trục Y với định dạng 100K, 200K, ..., 900K
        chart.append("g")
            .call(d3.axisLeft(y)
                .tickFormat(d => `${(d / 1_000).toFixed(0)}K`)
                .ticks(9)
            )
            .style("font-size", "11px");
        // Thêm tiêu đề cho biểu đồ
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "18px")
            .attr("fill", "#337ab7")
            .text("Doanh số bán hàng trung bình theo Khung giờ");

        // Tạo tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("padding", "10px")
            .style("pointer-events", "none")
            .style("text-align", "left");
    }).catch(error => console.error("Lỗi tải dữ liệu:", error));
});
