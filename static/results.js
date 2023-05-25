console.log("The results data stored in the \"results\" variable, displayed below:");
console.log(results);

document.getElementById('date').innerText = new Date(results.exportTime).toLocaleString();
let table = document.getElementsByTagName('tbody')[0];
for (let c of results.characters) {
    let row = document.createElement('tr');
    const appendCell = text => {
        let cell = document.createElement('td');
        cell.innerText = text;
        row.appendChild(cell);
        return cell;
    }
    appendCell(c.name).innerHTML += ` <a href="${c.link}" target="_blank"><img src="${c.image}" class="rounded" width="40"></a>`;
    appendCell(c.totalVotes);
    appendCell(c.numWins);
    appendCell(c.numLosses);
    appendCell(`${Math.round(c.winRate*100)}`);
    appendCell(c.uniqueVoters)
    appendCell(c.notPlayed)
    appendCell(`${Math.round(c.playedRate*100)}`)
    appendCell('').innerHTML = `<button class="btn btn-primary btn-sm" onclick="compare(${c.id})">Compare</Button>`
    table.appendChild(row);
}
$('table').bootstrapTable();