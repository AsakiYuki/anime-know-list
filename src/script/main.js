"use strict";

let canClick = true;

const getAnimeInfoByID = async (id, isBasic) => {
    try {
        if (!['number', 'string'].includes(typeof id)) throw "ID is not a number or string!";
        const query = (isBasic) ? `query {
            Media (${(typeof id === 'number') ? `id: ${id}` : `search: "${id}"`}, type: ANIME) {
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
        }` : `query {
            Media (${(typeof id === 'number') ? `id: ${id}` : `search: "${id}"`}, type: ANIME) {
                title {
                    romaji
                    english
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
                trailer {
                    id
                    site
                }
                averageScore
                popularity
                hashtag
                id
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
                query: query
            })
        })).json()).data;
    } catch (error) {
        console.error(error)
    }
}

const searchFandom = async (name) => {
    return (await (await fetch(`https://www.googleapis.com/customsearch/v1?q=anime fandom ${name}&key=AIzaSyDXHeKauCPw25g0szqSm4_j6mC8Pu79csY&cx=122cd0496ab3640c3&num=1`)).json()).items[0].link
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
                document.getElementById('animeList').querySelectorAll(`[index=${animeIndex}]`)[0].style.display = ''
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
    document.getElementById('video_trailer').src = ''
    canClick = true;
}

const innerText = (id, value) => {
    document.getElementById(id).innerHTML = value;
}

const loadInfoByIndex = async (index, isIndex) => {
    try {
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
        innerText('anilistid', infoData.id);
        document.getElementById('hashtag').href = `https://twitter.com/search?q=${encodeURIComponent(infoData.hashtag)}&src=typed_query`;
        document.getElementById('anime_full_detail').style.display = ''

        const searchItem = new URL(await searchFandom(infoData.title.romaji)).origin;
        document.getElementById('setFandomURL').href = searchItem;
        document.getElementById('fandomImage').src = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=64&url=${searchItem}`

        if (infoData.trailer?.id) {
            document.getElementById('video_trailer').style.display = ''
            document.getElementById('video_trailer').src = `https://www.youtube.com/embed/${infoData.trailer?.id}?autoplay=1`
        }
        else
            document.getElementById('video_trailer').style.display = 'none'
    } catch (error) {
        canClick = true;
        alert('Unable to search for Anime using your Anime ID')
    }
}

document.getElementById('getAnimeByID').onkeydown = async (e) => {
    if (e.code === 'Enter') {
        loadInfoByIndex((!+e.target.value) ? e.target.value : +e.target.value, false);
    }
}

document.getElementById('searchAnimeByIDBtn').onclick = () => {
    const e = document.getElementById('getAnimeByID')
    loadInfoByIndex((!+e.value) ? e.value : +e.value, false);
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
            loadPageList(+e.target.value);
            localStorage.setItem('currentPage', e.target.value)
        } catch (error) {
            alert('This ID is not available!')
            canClick = true;
        }
    }
}

document.getElementById('pageLeft').onclick = async () => {
    const e = document.getElementById('inputPage');
    const aniList = (await (await fetch('./src/data/aniInfo.json')).json()).length;
    e.value = (+e.value - 1 < 0) ? Math.floor(aniList / 10) : e.value - 1;
    loadPageList(+e.value);
    localStorage.setItem('currentPage', e.value)
}

document.getElementById('pageRight').onclick = async () => {
    const e = document.getElementById('inputPage');
    const aniList = (await (await fetch('./src/data/aniInfo.json')).json()).length;
    e.value = (+e.value + 1 > (aniList / 10)) ? 0 : +e.value + 1;
    loadPageList(+e.value);
    localStorage.setItem('currentPage', e.value)
}

document.getElementById('applyButton').onclick = async () => {
    try {
        const e = document.getElementById('inputPage')
        const aniList = (await (await fetch('./src/data/aniInfo.json')).json()).length;
        e.value = (+e.value < (aniList / 10)) ? e.value : Math.floor(aniList / 10);
        loadPageList(+e.value);
        localStorage.setItem('currentPage', e.value)
    } catch (error) {
        alert('This ID is not available!')
        canClick = true;
    }
}

async function startup() {
    const params = new URLSearchParams(location.search.split('?')[1]);
    const urlData = {
        page: +params.get('page'),
        animeID: +params.get('anime'),
        no_load_page: params.get('loadpage'),
        search: params.get('search')
    }

    if (urlData.no_load_page === '0') { }
    else if (urlData.page) {
        loadPageList(urlData.page)
        document.getElementById('inputPage').value = urlData.page;
    } else {
        const current = localStorage.getItem('currentPage');
        loadPageList((current) ? +current : 0)
        document.getElementById('inputPage').value = (current) ? +current : 0;
    }

    if (urlData.animeID) {
        loadInfoByIndex(urlData.animeID, false);
    } else if (urlData.search) {
        loadInfoByIndex(urlData.search, false);
    }
}

startup()