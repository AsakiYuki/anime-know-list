"use strict";

let canClick = true;

function buildCharacterList(data, elementId, toggleElement) {
    const toggle = document.getElementById(toggleElement);
    toggle.style.display = (data.length !== 0) ? '' : 'none';
    toggle.setAttribute('toggle', 'false');
    const toggleInteract = document.getElementById(elementId);
    toggleInteract.style.display = 'none';
    if (toggle.classList.value.split(' ').includes('active')) toggle.classList.remove('active')
    toggle.onclick = () => {
        const toggleData = toggle.getAttribute('toggle') === 'false';
        toggle.setAttribute('toggle', `${toggleData}`);
        toggleInteract.style.display = (toggleData) ? '' : 'none';
        if (toggleData) toggle.classList.add('active')
        else toggle.classList.remove('active')
    }

    data.forEach(v => {
        const charInfo = document.createElement('div');
        charInfo.className = 'charItem';
        charInfo.setAttribute('type', 'anime_char');
        charInfo.title = 'Click to Quick Search on Pixiv';
        charInfo.innerHTML = `<img id="charPreview" src="${v.char.previewImage}">
            <div class="charInfo">
                <img class="gender" src="${(v.char.isGirl ? 'https://cdn-icons-png.flaticon.com/512/4022/4022596.png' : 'https://cdn-icons-png.flaticon.com/512/8816/8816572.png')}">
                <a class="name">[${v.char.id}] ${v.char.name.full} <a class="inside">/ ${v.char.name.native}</a></a><br>
                <a class="info" ${(!v.char.dateOfBirth) ? 'style="display: none"' : ''}>Birthday: ${v.char.dateOfBirth} - Age: ${v.char.age}<br></a>
                <a class="info" ${(!v.char.bloodType) ? 'style="display: none"' : ''}>Bloodtype: ${v.char.bloodType}<br></a>
                <a class="info">Favourites: ${v.char.favourites}<br></a>
                ${(v.voice.is_has_voice) ? `<a class="info">Voice: <img style="width: 15px; height: 15px;" class="gender" src="${(v.voice.isGirl ? 'https://cdn-icons-png.flaticon.com/512/4022/4022596.png' : 'https://cdn-icons-png.flaticon.com/512/8816/8816572.png')}"> [${v.voice.id}] ${v.voice.name.full} - ${v.voice.name.native}</a>
                </div>` : ''}`;

        charInfo.onclick = () => {
            window.open(`https://www.pixiv.net/en/tags/${v.char.name.full}/artworks`)
        }
        toggleInteract.appendChild(charInfo);
    })
}

function AnalyzeChar(cl) {
    const list = [];
    cl.forEach(v => {
        list.push({
            char: {
                id: v.node.id,
                age: (v.node.age) ? v.node.age : 'unknown',
                bloodType: v.node.bloodType,
                favourites: v.node.favourites,
                isGirl: v.node.gender === 'Female',
                dateOfBirth: (v.node.dateOfBirth.day || v.node.dateOfBirth.month || v.node.dateOfBirth.year) ? `${v.node.dateOfBirth.day}/${v.node.dateOfBirth.month}/${v.node.dateOfBirth.year}`.replace(/\/null/g, '') : 'unknown',
                name: v.node.name,
                previewImage: v.node.image.large
            },
            voice: {
                is_has_voice: v?.voiceActors[0]?.id !== undefined,
                id: v?.voiceActors[0]?.id,
                isGirl: v?.voiceActors[0]?.gender === 'Female',
                name: v?.voiceActors[0]?.name
            }
        })
    });
    return list;
}

const getAnilistData = async (query) => {
    return (await (await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }, body: JSON.stringify({
            query: query
        })
    })).json()).data.Media;
}

const getAnimeInfoByID = async (id, isBasic) => {
    try {
        if (!['number', 'string'].includes(typeof id)) throw "ID is not a number or string!";
        const query = (isBasic) ? `query {
            Media (${(typeof id === 'number') ? `id: ${id}` : `search: "${id}"`}, type: ANIME){seasonYear,description,episodes,bannerImage,title{romaji},coverImage{large}}}` : `query{Media (${(typeof id === 'number') ? `id: ${id}` : `search: "${id}"`}, type: ANIME){title{romaji,english},description,studios{edges{id,isMain,node{name}}},source,episodes,seasonYear,trailer{id,site},averageScore,popularity,hashtag,id,coverImage{extraLarge}}}`;

        return (isBasic) ? getAnilistData(query) : {
            info: (await getAnilistData(query)),
            mainChar: (await getAnilistData(`query {
                Media (${(typeof id === 'number') ? `id: ${id}` : `search: "${id}"`}, type: ANIME){characters(role: MAIN){edges{role,voiceActors (language: JAPANESE){id,gender,name{full,native}},node{id,age,bloodType,favourites,gender,dateOfBirth{year,month,day},name{full,native},image{large}}}}}}`)),
            supoChar: (await getAnilistData(`query {
                Media (${(typeof id === 'number') ? `id: ${id}` : `search: "${id}"`}, type: ANIME){characters(role: SUPPORTING){edges{role,voiceActors (language: JAPANESE){id,gender,name{full,native}},node{id,age,bloodType,favourites,gender,dateOfBirth{year,month,day},name{full,native},image{large}}}}}}`)),
            backChar: (await getAnilistData(`query {
                    Media (${(typeof id === 'number') ? `id: ${id}` : `search: "${id}"`}, type: ANIME){characters(role: BACKGROUND){edges{role,voiceActors (language: JAPANESE){id,gender,name{full,native}},node{id,age,bloodType,favourites,gender,dateOfBirth{year,month,day},name{full,native},image{large}}}}}}`))
        }
    } catch (error) {
        console.error(error)
    }
}
let currAPIKey = 0;
const apiKeyList = [
    'AIzaSyDXHeKauCPw25g0szqSm4_j6mC8Pu79csY',
    'AIzaSyCgRu_nOpvjhvay6jZmqfiTm6Re_Nsb5as',
    'AIzaSyBBMiW4e10NcKdBvPrqICpu5MX7_LD9hUI',
    'AIzaSyA-JilwxHUyuA6pL1URp63Gm1JhrpKPCxs'
]
const searchFandom = async (name) => {
    try {
        return (await (await fetch(`https://www.googleapis.com/customsearch/v1?q=anime fandom ${name}&key=${apiKeyList[currAPIKey]}&cx=122cd0496ab3640c3&num=1`)).json()).items[0].link
    } catch (error) {
        currAPIKey++;
        return searchFandom(name);
    }
}
const indexLoaded = []
let currentPageNow = 0
const loadPageList = async (page) => {
    currentPageNow = page;
    const getAnimeList = await (await fetch('./src/data/aniInfo.json')).json();
    for (const e of document.getElementById('animeList').getElementsByClassName('anime_item')) {
        e.style.display = 'none';
    }
    for (let animeIndex = page * 10; animeIndex < (page + 1) * 10; animeIndex++) {
        if (animeIndex < getAnimeList.length) {
            if (indexLoaded.includes(animeIndex)) {
                document.getElementById('animeList').querySelectorAll(`[index="${animeIndex}"]`)[0].style.display = ''
            } else {
                const data = (await getAnimeInfoByID(getAnimeList[animeIndex], true));
                const aniBtn = document.createElement('button');
                aniBtn.className = 'anime_item';
                aniBtn.style.display = ((currentPageNow * 10) <= animeIndex && animeIndex < ((currentPageNow + 1) * 10)) ? '' : 'none';
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
    for (const e of document.querySelectorAll('[type="anime_char"]')) {
        e.remove()
    }
    canClick = true;
}
const innerText = (id, value) => {
    document.getElementById(id).innerHTML = value;
}
const loadInfoByIndex = async (index, isIndex) => {
    try {
        canClick = false;
        const data = (isIndex) ? (await getAnimeInfoByID(((await (await fetch('./src/data/aniInfo.json')).json()))[index])) : (await getAnimeInfoByID(index));

        const infoData = data.info;
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
        document.getElementById('setSpotifyURL').href = `https://open.spotify.com/search/${infoData.title.romaji}`;
        document.getElementById('setANiiX.TOSrc').href = `https://anix.to/filter?keyword=${infoData.title.romaji}`;
        document.getElementById('conglightnovelsearch').href = `https://www.novelcool.com/search/?wd=${infoData.title.romaji}`
        if (infoData.trailer?.id) {
            document.getElementById('video_trailer').style.display = ''
            document.getElementById('video_trailer').src = `https://www.youtube.com/embed/${infoData.trailer?.id}?autoplay=1`
        }
        else
            document.getElementById('video_trailer').style.display = 'none';
        buildCharacterList(AnalyzeChar(data.mainChar.characters.edges), 'main_character_list', 'main_character_list_toggle');
        buildCharacterList(AnalyzeChar(data.supoChar.characters.edges), 'supporting_character_list', 'supporting_character_list_toggle');
        buildCharacterList(AnalyzeChar(data.backChar.characters.edges), 'background_character_list', 'background_character_list_toggle');
    } catch (error) {
        canClick = true;
        console.warn(error)
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