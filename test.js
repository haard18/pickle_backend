function parseData(){
    const parsedDate = new Date(date);
    console.log(parsedDate)
    parsedDate.setUTCHours(0, 0, 0, 0);
    return parsedDate
}
const date='2024-01-04';
console.log(parseData(date));
