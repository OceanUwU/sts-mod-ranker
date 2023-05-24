const socket = io();
socket.on('connect', () => console.log('connected to socket.io'));
socket.on('vote', (items, times) => {
    document.getElementById('me').innerText = times;
    document.getElementById('load').classList.add('d-none');
    document.getElementById('vote').classList.remove('d-none');
    items.forEach((char, index) => {
        let button = document.getElementById('options').children[index*2].firstChild;
        button.firstChild.src = char.image;
        button.lastChild.innerText = char.name;
        document.getElementById('options').children[index*2].lastChild.firstChild.href = char.link;
    });
    console.log(items);
});
socket.on('total', times => document.getElementById('total').innerText = times);
socket.on('voters', voters => document.getElementById('voters').innerText = voters);
socket.on('none', () => {
    document.getElementById('load').classList.add('d-none');
    document.getElementById('finish').classList.remove('d-none');
});

function load() {
    document.getElementById('vote').classList.add('d-none');
    document.getElementById('load').classList.remove('d-none');
}

function vote(option) {
    load();
    socket.emit('vote', option);
}

function blacklist(option) {
    load();
    socket.emit('blacklist', option);
}

function reroll() {
    load();
    socket.emit('reroll');
}