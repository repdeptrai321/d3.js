document.addEventListener("DOMContentLoaded", function () {
    // Đọc dữ liệu từ file CSV
    d3.csv("data_ggsheet.csv").then(data => {
        if (!data || data.length === 0) {
            console.error("Dữ liệu chưa được load hoặc rỗng!");
            return;
        }
        
        console.log("Dữ liệu đã load:", data);

        // Định dạng kích thước
        const margin = { top: 40, right: 50, bottom: 50, left: 80 },
            width = 1200,
            height = 700;

        // Chuyển đổi dữ liệu
        data.forEach(d => {
            d["Thành tiền"] = +d["Thành tiền"] || 0;
            d["SL"] = +d["SL"] || 0;
            d["Thời gian tạo đơn"] = d3.timeParse("%Y-%m-%d %H:%M:%S")(d["Thời gian tạo đơn"]);
        });

        // Tổng hợp doanh thu theo tháng
        const revenueByMonth = d3.rollups(
            data,
            v => ({
                value: d3.sum(v, d => d["Thành tiền"]),
                quantity: d3.sum(v, d => d["SL"])
            }),
            d => d3.timeFormat("%m")(d["Thời gian tạo đơn"])
        ).map(([month, obj]) => ({ month: `Tháng ${month}`, value: obj.value, quantity: obj.quantity }));

        // Sắp xếp đúng thứ tự tháng
        revenueByMonth.sort((a, b) => parseInt(a.month.split(" ")[1]) - parseInt(b.month.split(" ")[1]));

        const svg = d3.select("#chart3")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        // Tạo scale
        const x = d3.scaleBand()
            .domain(revenueByMonth.map(d => d.month))
            .range([margin.left, width - margin.right])
            .padding(0.3);

        const y = d3.scaleLinear()
            .domain([0, d3.max(revenueByMonth, d => d.value) * 1.2])
            .nice()
            .range([height - margin.bottom, margin.top]);

        const colorScale = d3.scaleOrdinal(d3.schemePastel1);

        // Vẽ cột
        svg.selectAll(".bar")
            .data(revenueByMonth)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.month))
            .attr("y", d => y(d.value))
            .attr("width", x.bandwidth())
            .attr("height", d => height - margin.bottom - y(d.value))
            .attr("fill", d => colorScale(d.month));

        // Nhãn số liệu trên cột
        svg.selectAll(".label")
            .data(revenueByMonth)
            .enter()
            .append("text")
            .attr("x", d => x(d.month) + x.bandwidth() / 2)
            .attr("y", d => y(d.value) - 10)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("fill", "black")
            .text(d => `${Math.round(d.value / 1e6)} triệu VNĐ`);

        // Trục X
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x))
            .style("font-size", "11px");

        // Trục Y
        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(8).tickFormat(d => `${(d / 1e6).toFixed(0)}M`))
            .style("font-size", "11px");

        // Tiêu đề
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "18px")
            .attr("fill", "#337ab7")
            .text("Doanh số bán hàng theo Tháng");

    }).catch(error => console.error("Lỗi tải dữ liệu:", error));
});
