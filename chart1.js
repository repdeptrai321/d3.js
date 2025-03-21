// Đọc dữ liệu từ file CSV
d3.csv("data_ggsheet.csv").then(data => {
    // Kiểm tra dữ liệu đầu vào
    console.log("Dữ liệu gốc:", data);
    console.log("Cột có trong dữ liệu:", Object.keys(data[0]));

    // Chuyển đổi dữ liệu từ chuỗi sang số và xử lý ngày
    data.forEach(d => {
        d["Thành tiền"] = +d["Thành tiền"] || 0; // Chuyển thành số, mặc định 0 nếu không hợp lệ
        d["Thời gian tạo đơn"] = d3.timeParse("%Y-%m-%d %H:%M:%S")(d["Thời gian tạo đơn"]); // Chuyển sang định dạng Date
        if (!d["Thời gian tạo đơn"]) {
            console.warn("Dữ liệu 'Thời gian tạo đơn' không hợp lệ cho dòng:", d);
            d["Thời gian tạo đơn"] = new Date(); // Gán giá trị mặc định nếu không hợp lệ
        }
    });

    // Tổng hợp doanh thu theo mặt hàng và nhóm hàng (cho biểu đồ 1 và 2)
    const revenueByProduct = d3.rollups(
        data,
        v => ({
            value: d3.sum(v, d => d["Thành tiền"]),
            group: v[0]["Tên nhóm hàng"]
        }),
        d => `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`
    ).map(([name, obj]) => ({ name, value: obj.value, group: obj.group }));

    const revenueByGroup = d3.rollups(
        data,
        v => d3.sum(v, d => d["Thành tiền"]),
        d => `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`
    ).map(([group, value]) => ({ group, value }));

    // Sắp xếp dữ liệu theo doanh số giảm dần
    revenueByProduct.sort((a, b) => b.value - a.value);
    revenueByGroup.sort((a, b) => b.value - a.value);

    // Danh sách màu cho từng nhóm hàng
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain([...new Set(revenueByProduct.map(d => d.group))]);

    // Kích thước SVG
    const width = 1200;
    const height = 700;
    const margin = { top: 40, right: 250, bottom: 50, left: 220 };

    // Biểu đồ 1: Doanh số bán hàng theo Mặt hàng
    const svg = d3.select("#chart1")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleLinear()
        .domain([0, d3.max(revenueByProduct, d => d.value)])
        .nice()
        .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
        .domain(revenueByProduct.map(d => d.name))
        .range([margin.top, height - margin.bottom])
        .padding(0.2);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d / 1e6}M`));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    svg.selectAll(".bar")
        .data(revenueByProduct)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", margin.left)
        .attr("y", d => y(d.name))
        .attr("width", d => x(d.value) - margin.left)
        .attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d.group));

    svg.selectAll(".label")
        .data(revenueByProduct)
        .enter()
        .append("text")
        .attr("x", d => x(d.value) + 10)
        .attr("y", d => y(d.name) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("font-size", "14px")
        .attr("fill", d => d3.color(colorScale(d.group)).darker(2))
        .text(d => `${Math.round(d.value / 1e6)} triệu VND`);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("fill", "#009688")
        .text("Doanh số bán hàng theo Mặt hàng");


}).catch(error => console.error("Lỗi tải dữ liệu:", error));