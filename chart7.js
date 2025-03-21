document.addEventListener("DOMContentLoaded", function () {
    d3.csv("data_ggsheet.csv").then(data => {
        if (!data || data.length === 0) {
            console.error("Dữ liệu chưa được load hoặc rỗng!");
            return;
        }

        console.log("Dữ liệu đã load:", data);

        const margin = { top: 40, right: 40, bottom: 50, left: 200 },
            width = 900,
            height = 500;

        // Chuyển đổi dữ liệu
        data.forEach(d => {
            d["Thành tiền"] = isNaN(+d["Thành tiền"]) ? 0 : +d["Thành tiền"];
            d["SL"] = isNaN(+d["SL"]) ? 0 : +d["SL"];
        });

        // Chuẩn hóa dữ liệu
        const data1 = data.map(d => ({
            "Mã đơn hàng": d["Mã đơn hàng"],
            "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
            "Thành tiền": d["Thành tiền"],
            "SL": d["SL"]
        }));

        // Tổng số đơn hàng duy nhất
        const totalOrders = [...new Set(data1.map(d => d["Mã đơn hàng"]))].length;

        // Tổng hợp dữ liệu theo Nhóm hàng
        const aggregatedData = Array.from(
            d3.group(data1, d => d["Nhóm hàng"]),
            ([key, values]) => ({
                "Nhóm hàng": key,
                "Thành tiền": d3.sum(values, d => d["Thành tiền"]),
                "SL": d3.sum(values, d => d["SL"]),
                "Mã đơn hàng": [...new Set(values.map(d => d["Mã đơn hàng"]))]
            })
        ).map(d => ({
            ...d,
            "Xác suất bán": (d["Mã đơn hàng"].length / totalOrders) * 100, // Xác suất bán %
            "SL Đơn Bán": d["Mã đơn hàng"].length
        }));

        // Sắp xếp theo xác suất bán giảm dần
        aggregatedData.sort((a, b) => b["Xác suất bán"] - a["Xác suất bán"]);

        // Khởi tạo SVG
        const svg = d3.select("#chart7")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Thang đo
        const x = d3.scaleLinear()
            .domain([0, d3.max(aggregatedData, d => d["Xác suất bán"])])
            .nice()
            .range([0, width]);

        const y = d3.scaleBand()
            .domain(aggregatedData.map(d => d["Nhóm hàng"]).reverse())
            .range([height, 0])
            .padding(0.2);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // Vẽ các cột
        chart.selectAll(".bar")
            .data(aggregatedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => y(d["Nhóm hàng"]))
            .attr("width", d => x(d["Xác suất bán"]))
            .attr("height", y.bandwidth())
            .attr("fill", d => colorScale(d["Nhóm hàng"]));

        // Nhãn phần trăm trên cột
        chart.selectAll(".label")
            .data(aggregatedData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d["Xác suất bán"]) + 5)
            .attr("y", d => y(d["Nhóm hàng"]) + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .text(d => `${d["Xác suất bán"].toFixed(1)}%`)
            .style("font-size", "10px");

        // Thêm trục X
        chart.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d => `${d}%`).ticks(6))
            .style("font-size", "11px");

        // Thêm trục Y
        chart.append("g")
            .call(d3.axisLeft(y))
            .style("font-size", "11px");

        // Thêm tiêu đề biểu đồ
        svg.append("text")
            .attr("x", (width + margin.left + margin.right) / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "18px")
            .attr("fill", "#337ab7")
            .text("Xác suất bán hàng theo Nhóm hàng");

    }).catch(error => console.error("Lỗi tải dữ liệu:", error));
});
