(async () => {
    const fs = require('fs');
    const db = require('./models');
    const characters = require('./characters.json');

    let votes = await db.Vote.findAll();
    let blacklists = await db.Blacklist.findAll();
    let charIndexes = {};
    for (let i in characters)
        charIndexes[characters[i].id] = Number(i);
    
    let results = {};
    results.exportTime = Date.now();
    results.totalVotes = votes.length;
    results.votes = votes.map(v => [charIndexes[v.win], charIndexes[v.lose]]);
    results.uniqueVoters = [...new Set(votes.map(v => v.user))].length;
    results.characters = characters.map((c, i) => {
        c.wins = results.votes.filter(v => v[0] == i).map(v => v[1]);
        c.losses = results.votes.filter(v => v[1] == i).map(v => v[0]);
        c.numWins = c.wins.length;
        c.numLosses = c.losses.length;
        c.totalVotes = c.numWins + c.numLosses;
        c.winRate = c.wins.length / c.totalVotes;
        c.uniqueVoters = [...new Set(votes.filter(v => v.win == c.id || v.lose == c.id).map(v => c.user))].length;
        c.notPlayed = blacklists.filter(b => b.char == c.id).length;
        c.playedRate = c.uniqueVoters / (c.uniqueVoters + c.notPlayed);
        c.id = i;
        c.comparisons = characters.filter(c2 => c != c2).map((c2, j) => {
            let comparison = {
                vs: c2.name,
                wins: c.wins.filter(v => v == j).length,
                losses: c.losses.filter(v => v == j).length,
            };
            comparison.totalMatchups = comparison.wins + comparison.losses;
            comparison.winRate = comparison.wins / comparison.totalMatchups;
            return comparison;
        });
        return c;
    });
    
    fs.writeFileSync('results.json', JSON.stringify(results));
})();