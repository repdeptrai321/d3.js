document.addEventListener("DOMContentLoaded", function () {
    d3.csv("data_ggsheet.csv").then(data => {
        if (!data || data.length === 0) {
            console.error("Dữ liệu chưa được load hoặc rỗng!");
            return;
        }

        console.log("Dữ liệu đã load:", data);

        // Định nghĩa kích thước
        const margin = { top: 60, right: 200, bottom: 100, left: 200 },
            width = 900,
            height = 400;

        // Chuyển đổi dữ liệu
        const data1 = data.map(d => ({
            "Mã đơn hàng": d["Mã đơn hàng"],
            "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
            "Thành tiền": parseFloat(d["Thành tiền"]) || 0,
            "SL": parseFloat(d["SL"]) || 0,
            "Tháng tạo đơn": `Tháng ${new Date(d["Thời gian tạo đơn"]).getMonth() + 1}` // Lấy tháng chính xác từ dữ liệu
        }));

        // Tính tổng số đơn hàng theo tháng
        const totalOrdersByMonth = data1.reduce((acc, item) => {
            const month = item["Tháng tạo đơn"];
            if (!acc[month]) {
                acc[month] = new Set();
            }
            acc[month].add(item["Mã đơn hàng"]);
            return acc;
        }, {});

        // Tổng hợp dữ liệu theo nhóm hàng và tháng
        const aggregatedData = data1.reduce((acc, item) => {
            const key = `${item["Tháng tạo đơn"]}|${item["Nhóm hàng"]}`;
            if (!acc[key]) {
                acc[key] = {
                    "Tháng": item["Tháng tạo đơn"],
                    "Nhóm hàng": item["Nhóm hàng"],
                    "Mã đơn hàng": new Set(),
                    "SL": 0
                };
            }
            acc[key]["Mã đơn hàng"].add(item["Mã đơn hàng"]);
            acc[key]["SL"] += item["SL"];
            return acc;
        }, {});

        // Chuyển đổi dữ liệu về mảng và tính xác suất bán
        const finalData = Object.values(aggregatedData).map(d => ({
            ...d,
            "Xác suất bán": (d["Mã đơn hàng"].size / totalOrdersByMonth[d["Tháng"]].size) * 100,
            "SL Đơn Bán": d["Mã đơn hàng"].size
        }));

        // Tạo SVG
        const svg = d3.select("#chart8")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Thang đo X
        const x = d3.scaleBand()
            .domain(["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"])
            .range([0, width])
            .padding(0.1);

        // Thang đo Y (tự động lấy min/max)
        const y = d3.scaleLinear()
            .domain([0, d3.max(finalData, d => d["Xác suất bán"])])
            .nice()
            .range([height, 0]);

        // Màu sắc cho nhóm hàng
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // Nhóm dữ liệu theo Nhóm hàng
        const groupedData = d3.groups(finalData, d => d["Nhóm hàng"]);

        // Vẽ đường biểu diễn dữ liệu
        const line = d3.line()
            .x(d => x(d["Tháng"]) + x.bandwidth() / 2)
            .y(d => y(d["Xác suất bán"]));

        const lines = chart.selectAll(".line")
            .data(groupedData)
            .enter()
            .append("path")
            .attr("class", "line")
            .attr("d", d => line(d[1]))
            .attr("stroke", d => colorScale(d[0]))
            .attr("fill", "none")
            .attr("stroke-width", 2);

        // Vẽ marker trên các điểm
        const markers = chart.selectAll(".marker")
            .data(finalData)
            .enter()
            .append("circle")
            .attr("class", "marker")
            .attr("cx", d => x(d["Tháng"]) + x.bandwidth() / 2)
            .attr("cy", d => y(d["Xác suất bán"]))
            .attr("r", 4)
            .attr("fill", d => colorScale(d["Nhóm hàng"]));

        // Trục X
        chart.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .style("font-size", "11px");

        // Trục Y
        chart.append("g")
            .call(d3.axisLeft(y)
                .tickFormat(d => `${d}%`)
                .ticks(10))
            .style("font-size", "11px");

        // Thêm tiêu đề biểu đồ
        svg.append("text")
            .attr("x", (width + margin.left + margin.right) / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "18px")
            .attr("fill", "#337ab7")
            .text("Xác suất bán hàng của Nhóm hàng theo Tháng");

        // Tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("padding", "10px")
            .style("pointer-events", "none")
            .style("text-align", "left");

        // Sự kiện hover cho marker
        markers.on("mouseover", function (event, d) {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`
                <p><strong>${d["Tháng"]}</strong></p>
                <p><strong>Nhóm hàng: ${d["Nhóm hàng"]}</strong></p>
                <p><strong>SL Đơn Bán:</strong> ${d["SL Đơn Bán"].toLocaleString()}</p>
                <p><strong>Xác suất Bán:</strong> ${d["Xác suất bán"].toFixed(1)}%</p>
            `)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px")
                .style("font-size", "11px");
        }).on("mouseout", function () {
            tooltip.transition().duration(500).style("opacity", 0);
        });

    }).catch(error => console.error("Lỗi tải dữ liệu:", error));
});
