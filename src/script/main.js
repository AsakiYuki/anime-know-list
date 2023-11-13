"use strict";

let canClick = true;

const getAnimeInfoByID = async (id, isBasic) => {
    try {
        if (typeof id !== 'number') throw "ID is not a number";
        const query = (isBasic) ? `query ($id: Int) {
            Media (id: $id, type: ANIME) {
                seasonYear
                description
                episodes
                title {
                    romaji
                }
                coverImage {
                    large
                }
            }
        }` : `query ($id: Int) {
            Media (id: $id, type: ANIME) {
                title {
                    romaji
                }
                description
                
                studios {
                    edges {
                        id
                        isMain
                        node {
                            name
                        }
                    }
                }
                source
                episodes
                seasonYear
                averageScore
                popularity
                hashtag
                coverImage {
                    extraLarge
                }
            }
        }`;

        return (await (await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }, body: JSON.stringify({
                query: query,
                variables: { id }
            })
        })).json()).data;
    } catch (error) {
        console.error(error)
    }
}

const indexLoaded = []

const loadPageList = async (page) => {
    const getAnimeList = await (await fetch('./src/data/aniInfo.json')).json();
    for (const e of document.getElementById('animeList').getElementsByClassName('anime_item')) {
        e.style.display = 'none';
    }
    for (let animeIndex = page * 10; animeIndex < (page + 1) * 10; animeIndex++) {
        if (animeIndex < getAnimeList.length) {
            if (indexLoaded.includes(animeIndex)) {
                document.getElementById('animeList').getElementsByClassName('anime_item')[`${animeIndex}`].style.display = ''
            } else {
                const data = (await getAnimeInfoByID(getAnimeList[animeIndex].id, true)).Media;
                const aniBtn = document.createElement('button');
                aniBtn.className = 'anime_item';
                aniBtn.setAttribute('index', `${animeIndex}`);
                aniBtn.innerHTML = `<img class="anime_thumb"src="${data.coverImage.large}"><div class="anime_info"><div class="anime_name"><a>${data.title.romaji}</a></div><div class="anime_description"><a>${data.description}</a></div><div class="episodes"><a>Episodes: ${data.episodes} - Season Year: ${data.seasonYear}</a></div></div>`
                indexLoaded.push(animeIndex);
                document.getElementById('animeList').appendChild(aniBtn);
                document.getElementById('animeList').appendChild(document.getElementById('changePage'));

                aniBtn.onclick = (e) => {
                    if (canClick) loadInfoByIndex(animeIndex, true);
                }
            }
        }
    }
}

document.getElementById('closeButton').onclick = () => {
    document.getElementById('anime_full_detail').style.display = 'none'
    canClick = true;
}

const innerText = (id, value) => {
    document.getElementById(id).innerHTML = value;
}

const loadInfoByIndex = async (index, isIndex) => {
    canClick = false;
    const infoData = (isIndex) ? (await getAnimeInfoByID(((await (await fetch('./src/data/aniInfo.json')).json()))[index].id)).Media : (await getAnimeInfoByID(index)).Media;

    const studios = [], product = [];
    infoData.studios.edges.forEach(v => {
        if (v.isMain) studios.push(v.node.name)
        else product.push(v.node.name)
    })

    document.getElementById('preview_image').src = infoData.coverImage.extraLarge;
    innerText('anime_name', infoData.title.romaji);
    innerText('description', infoData.description);
    innerText('studio', studios.join(', '));
    innerText('producers', product.join(', '));
    innerText('source', infoData.source)
    innerText('episodes', infoData.episodes);
    innerText('season', infoData.seasonYear);
    innerText('average_score', infoData.averageScore);
    innerText('popularity', infoData.popularity);
    innerText('hashtag', infoData.hashtag);
    document.getElementById('hashtag').href = `https://twitter.com/search?q=${infoData.hashtag}&src=typed_query`;
    document.getElementById('anime_full_detail').style.display = ''
}

document.getElementById('inputPage').oninput = async (e) => {
    const iv = +e.target.value?.match(/\d+/g)?.join('')
    e.target.value = (iv) ? +iv : 0;
}

document.getElementById('inputPage').onkeydown = async (e) => {
    if (e.code === 'Enter') {
        try {
            const aniList = (await (await fetch('./src/data/aniInfo.json')).json()).length
            e.target.value = (+e.target.value < (aniList / 10)) ? e.target.value : Math.floor(aniList / 10);
            loadPageList(+e.value);
        } catch (error) {
            alert('This ID is not available!')
            canClick = true;
        }
    }
}

document.getElementById('getAnimeByID').oninput = async (e) => {
    const iv = +e.target.value?.match(/\d+/g)?.join('')
    e.target.value = (iv) ? +iv : 0;
}

document.getElementById('getAnimeByID').onkeydown = async (e) => {
    if (e.code === 'Enter') {
        loadInfoByIndex(+e.target.value)
    }
}

document.getElementById('pageLeft').onclick = async () => {
    const e = document.getElementById('inputPage');
    const aniList = (await (await fetch('./src/data/aniInfo.json')).json()).length;
    e.value = (+e.value - 1 < 0) ? Math.floor(aniList / 10) : e.value - 1;
    loadPageList(+e.value);
}

document.getElementById('pageRight').onclick = async () => {
    const e = document.getElementById('inputPage');
    const aniList = (await (await fetch('./src/data/aniInfo.json')).json()).length;
    e.value = (+e.value + 1 > (aniList / 10)) ? 0 : +e.value + 1;
    loadPageList(+e.value);
}

loadPageList(0)