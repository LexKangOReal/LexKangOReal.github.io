function getColorMap() {
    // Object Version of colorMapper
    const colorMapperObj = {
        t: "DarkOrange",
        tn: "DarkSalmon",
        st: "LightCoral",
        sn: "IndianRed",
        sst: "Plum",
        ssn: "Salmon",
        ssst: "CadetBlue",
        sssn: "LightSteelBlue",
        sssst: "PaleGreen",
        ssssn: "MediumAquaMarine",
        n: "Gold"
        // o: "Gainsboro"
    };
    // Convert object to map for easy iteration
    const colorMap = new Map(Object.entries(colorMapperObj));
    return colorMap;
}