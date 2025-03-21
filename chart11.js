document.addEventListener("DOMContentLoaded", function () {
    d3.csv("data_ggsheet.csv").then(data => {
        if (!data || data.length === 0) {
            console.error("Dữ liệu chưa được load hoặc rỗng!");
            return;
        }

        // **Tính số lượt mua hàng duy nhất theo Mã khách hàng**
        const soLuotMuaHang = d3.rollup(
            data,
            v => new Set(v.map(d => d["Mã đơn hàng"])).size,
            d => d["Mã khách hàng"]
        );

        // **Nhóm dữ liệu theo số lượt mua**
        const dfGrouped11 = Array.from(soLuotMuaHang.values());
        const dfGrouped11Count = Array.from(
            d3.rollup(dfGrouped11, v => v.length, d => d).entries(),
            ([soLuot, soLuong]) => ({ So_luot_mua_hang: +soLuot, So_luong_khach_hang: soLuong })
        ).sort((a, b) => a.So_luot_mua_hang - b.So_luot_mua_hang);

        // **Tạo tooltip**
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("padding", "8px 12px")
            .style("border-radius", "6px")
            .style("font-size", "12px")
            .style("display", "none");

        // **Tạo SVG**
        const width = Math.max(1000, dfGrouped11Count.length * 30); // Điều chỉnh chiều rộng theo số lượng dữ liệu
        const height = 500;
        const margin = { top: 60, right: 40, bottom: 100, left: 80 };

        const svg = d3.select("#chart11")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // **Tạo tỷ lệ trục**
        const xScale = d3.scaleBand()
            .domain(dfGrouped11Count.map(d => d.So_luot_mua_hang))
            .range([0, width - margin.left - margin.right])
            .padding(0.3); // Tăng khoảng cách giữa các cột

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(dfGrouped11Count, d => d.So_luong_khach_hang) * 1.1]) // Nhích thêm 10% để dễ đọc
            .nice()
            .range([height - margin.top - margin.bottom, 0]);

        // **Vẽ cột**
        svg.selectAll(".bar")
            .data(dfGrouped11Count)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.So_luot_mua_hang))
            .attr("y", d => yScale(d.So_luong_khach_hang))
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - margin.top - margin.bottom - yScale(d.So_luong_khach_hang))
            .attr("fill", "#007bff")
            .on("mouseover", function (event, d) {
                d3.select(this).attr("fill", "#0056b3"); // Đổi màu khi hover
                tooltip.style("display", "block")
                    .html(`
                        <strong>Số lượt mua:</strong> ${d.So_luot_mua_hang} <br>
                        <strong>Số khách:</strong> ${d.So_luong_khach_hang}
                    `)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 30}px`);
            })
            .on("mouseout", function () {
                d3.select(this).attr("fill", "#007bff"); // Trả lại màu gốc
                tooltip.style("display", "none");
            });

        // **Thêm trục X**
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(xScale).tickSize(0))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .style("font-size", "12px");

        // **Thêm trục Y**
        svg.append("g")
            .call(d3.axisLeft(yScale).ticks(10));

        // **Thêm nhãn trục**
        svg.append("text")
            .attr("x", (width - margin.left - margin.right) / 2)
            .attr("y", height - margin.bottom + 50)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("fill", "#333")
            .text("Số lượt mua hàng");

        svg.append("text")
            .attr("x", -(height - margin.top - margin.bottom) / 2)
            .attr("y", -50)
            .attr("transform", "rotate(-90)")
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("fill", "#333")
            .text("Số lượng khách hàng");

        // **Thêm tiêu đề chính**
        svg.append("text")
            .attr("x", (width - margin.left - margin.right) / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .attr("font-size", "20px")
            .attr("font-weight", "bold")
            .attr("fill", "#007bff")
            .text("Phân phối Lượt mua hàng");

    }).catch(error => {
        console.error("Error loading CSV:", error);
    });
});
