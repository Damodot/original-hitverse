let myDisplay = document.querySelector('.firstCont')
let songListed = document.querySelector('.songList')
let soundList = document.querySelector('.soundCheckList')
let popList = document.querySelector('.popList')
let player = document.querySelector('aside')
let section = document.querySelector('section')
let allMusic = document.querySelectorAll('.dad')
let allMusicTwo = document.querySelectorAll('.dadUnos')
let allMusicThree = document.querySelectorAll('.singer')
let myFirstView = document.querySelector('.loader')
let output = document.querySelector('.reply')
let playButton = document.querySelectorAll(".playBTN")
let audioPlayer = document.getElementById('audioPlayer')
let waiter = document.querySelector('.waiter')
let currentTime = document.querySelector('.current-time')
let totalTime = document.querySelector('.total-time')
let pushNamer = document.querySelector('.songNamer')
let songDp = document.querySelector('#songDp')
let fixedSongInfo = document.querySelector('.fixedCont')
let whereSongs = document.querySelector('.realList')
let likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];
let songsLister = document.getElementById('allSongsLister')
let albumsLister = document.getElementById('allAlbumsLister')
let likedLister = document.getElementById('allLikedLister')
let previous = document.getElementById('previous')
let next = document.getElementById('next')

const onGodLyrics = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 dad" value="On God"
    onclick="showLyrics(event)">
        <div class="image rounded-2 son"></div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">On God</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
</div>`
const koMaGbonLyrics = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 dadada" value="Ko Ma Gbon"
    onclick="showLyrics(event)">
        <div class="image myImage rounded-2">
            <img src="soundCheck.jpg" alt="" />
        </div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Ko Ma Gbon</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
</div>`
const cumeAlongLyrics = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 dad" value="Cume Along"
    onclick="showLyrics(event)">
        <div class="image rounded-2 son"></div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Cume Along</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
</div>`
const wantingMoreLyrics = ` 
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 dad" value="Wanting More"
    onclick="showLyrics(event)">
        <div class="image rounded-2 son"></div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Wanting More</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
</div>`
const fckedUpLyrics = ` 
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 dadUnos" value="Fcked Up"
    onclick="showLyrics(event)">
        <div class="image imageTwo rounded-2 sonUnos"></div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Fcked Up</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
</div>`
const mindLyrics = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center w-75 mt-3 dadUnos" value="Mind"
    onclick="showLyrics(event)">
        <div class="myImage rounded-2 sonUnos">
            <img src="IMG_3189.jpg" alt="" />
        </div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Mind</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
</div>`
const osheyLyrics = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 dadUnos" value="Oshey"
    onclick="showLyrics(event)">
        <div class="myImage rounded-2 sonUnos">
            <img src="IMG_3189.jpg" alt="" />
        </div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Oshey</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
</div>`
const majoLyrics = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 dadUnos" value="Majo"
    onclick="showLyrics(event)">
        <div class="image myImage rounded-3 sonUnos">
            <img src="IMG_3189.jpg" alt="" />
        </div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Majo</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
</div>`
const bootyCallLyrics = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 dadUnos" value="Booty Call"
    onclick="showLyrics(event)">
        <div class="image imageTwo rounded-2 sonUnos"></div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Booty Call</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
</div>`
const boloLyrics = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 dadUnos" value="Bolo"
    onclick="showLyrics(event)">
        <div class="image imageTwo rounded-2 sonUnos"></div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Bolo</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
</div>`
const killamanLyrics = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 singer" value="Killaman"
    onclick="showLyrics(event)">
        <div class="myImage rounded-2">
            <img src="IMG-9415.jpg" alt="" />
        </div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Killaman</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
</div>`
const nobodyLyrics = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 singer" value="Nobody"
    onclick="showLyrics(event)">
        <div class="image imageFive rounded-2"></div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Nobody</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
</div>`
const bodyBagLyrics = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 singer" value="Body Bag"
    onclick="showLyrics(event)">
        <div class="image imageBodyBag rounded-2"></div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Body Bag</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
</div>`

let allLyricsBtn = [onGodLyrics, koMaGbonLyrics, cumeAlongLyrics, wantingMoreLyrics, fckedUpLyrics, mindLyrics, osheyLyrics, majoLyrics, bootyCallLyrics, boloLyrics, killamanLyrics, nobodyLyrics, bodyBagLyrics]

const lyricsOnGod = `
<h6 class="whiteShad text-center text-white pt-2">When I was young</h6>
<h6 class="whiteShad text-center text-white pt-2">I thought I would make it on time</h6>
<h6 class="whiteShad text-center text-white pt-2">Life was smiling at me</h6>
<h6 class="whiteShad text-center text-white pt-2">Oh this shit is so wild</h6>
<h6 class="whiteShad text-center text-white pt-2">My daddy told me, omomi mura</h6>
<h6 class="whiteShad text-center text-white pt-2">Nkan tagba bari</h6>
<h6 class="whiteShad text-center text-white pt-2">Omo iyami he go far</h6>
<h6 class="whiteShad text-center text-white pt-2">My heart turn cold</h6>
<h6 class="whiteShad text-center text-white pt-2">Now this shit is so cozy</h6>
<h6 class="whiteShad text-center text-white pt-2">No money therefore im lonely</h6>
<h6 class="whiteShad text-center text-white pt-2">So many worries and this shit is all on me</h6>
<h6 class="whiteShad text-center text-white pt-2">I gotta  make it like right now</h6>
<h6 class="whiteShad text-center text-white pt-2">One O' clock, we up</h6>
<h6 class="whiteShad text-center text-white pt-2">Can't sleep got so may worries</h6>
<h6 class="whiteShad text-center text-white pt-2">Screaming oh God, let it pour</h6>
<h6 class="whiteShad text-center text-white pt-2">On my head your showers of blessing</h6>
<h6 class="whiteShad text-center text-white pt-2">Da di da da da</h6>
<h6 class="whiteShad text-center text-white pt-2">Da  da  da di da da da da</h6>
<h6 class="whiteShad text-center text-white pt-2">Da di da da da di da da da</h6>
<h6 class="whiteShad text-center text-white pt-2">I gast make it on God</h6>
<h6 class="whiteShad text-center text-white pt-2">Da di da da da</h6>
<h6 class="whiteShad text-center text-white pt-2">Da  da  da di da da da da</h6>
<h6 class="whiteShad text-center text-white pt-2">Da di da da da di da da da</h6>
<h6 class="whiteShad text-center text-white pt-2">That's on God</h6>
<h6 class="whiteShad text-center text-white pt-2">Won ti kpe mi na brother</h6>
<h6 class="whiteShad text-center text-white pt-2">Omo I dey wonder</h6>
<h6 class="whiteShad text-center text-white pt-2">I never cross border</h6>
<h6 class="whiteShad text-center text-white pt-2">I still dey for Apata</h6>
<h6 class="whiteShad text-center text-white pt-2">Olorun kiloshele?</h6>
<h6 class="whiteShad text-center text-white pt-2">Oma ti fe ma kpe</h6>
<h6 class="whiteShad text-center text-white pt-2">Mofe ball bi pele</h6>
<h6 class="whiteShad text-center text-white pt-2">Moti sofun won tele</h6>
<h6 class="whiteShad text-center text-white pt-2">I gast make it on God, on God</h6>
<h6 class="whiteShad text-center text-white pt-2">I gast make it on God, on God</h6>
<h6 class="whiteShad text-center text-white pt-2">Mama mi fe jere omo re</h6>
<h6 class="whiteShad text-center text-white pt-2">I gast make it on God, on God</h6>
<h6 class="whiteShad text-center text-white pt-2">Da di da da da</h6>
<h6 class="whiteShad text-center text-white pt-2">Da  da  da di da da da da</h6>
<h6 class="whiteShad text-center text-white pt-2">Da di da da da di da da da</h6>
<h6 class="whiteShad text-center text-white pt-2">I gast make it on God</h6>
<h6 class="whiteShad text-center text-white pt-2">Da di da da da</h6>
<h6 class="whiteShad text-center text-white pt-2">Da  da  da di da da da da</h6>
<h6 class="whiteShad text-center text-white pt-2">Da di da da da di da da da</h6>
<h6 class="whiteShad text-center text-white pt-2">That's on God</h6>`

const lyricsKoMaGbon = `
<h6 class="whiteShad text-center text-white pt-2">Yeah Yeah, Yeah Yeah Yeah Yeah</h6>
<h6 class="whiteShad text-center text-white pt-2">Yeah Yeah Yeah Yeah </h6>
<h6 class="whiteShad text-center text-white pt-2">Yeah Yeah Yeah Yeah, oshey oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Omotena lowa sofunmi kpe</h6>
<h6 class="whiteShad text-center text-white pt-2">She go like to dey my place everyday</h6>
<h6 class="whiteShad text-center text-white pt-2">She temme say, she temme say</h6>
<h6 class="whiteShad text-center text-white pt-2">She just dey gbadun my song everyday</h6>
<h6 class="whiteShad text-center text-white pt-2">Me tell her say, sho de ma josi?</h6>
<h6 class="whiteShad text-center text-white pt-2">Sho de ma josi? Yeah Yeah Yeah Yeah</h6>
<h6 class="whiteShad text-center text-white pt-2">Make a man jonzing</h6>
<h6 class="whiteShad text-center text-white pt-2">You make a man jonzing. Yeah Yeah Yeah Yeah</h6>
<h6 class="whiteShad text-center text-white pt-2">Orin mi lon josi, orin mi lon josi</h6>
<h6 class="whiteShad text-center text-white pt-2">Osha rimi bi mo she'n korin bi wizzy baby oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Komagbon komagbon</h6>
<h6 class="whiteShad text-center text-white pt-2">Komagbon komagbon komagbon</h6>
<h6 class="whiteShad text-center text-white pt-2">Komagbon komagbon</h6>
<h6 class="whiteShad text-center text-white pt-2">Je koma, je koma, je komagbon</h6>
<h6 class="whiteShad text-center text-white pt-2">Komagbon komagbon</h6>
<h6 class="whiteShad text-center text-white pt-2">Komagbon komagbon komagbon</h6>
<h6 class="whiteShad text-center text-white pt-2">Komagbon komagbon</h6>
<h6 class="whiteShad text-center text-white pt-2">Je koma, je koma, je komagbon</h6>
<h6 class="whiteShad text-center text-white pt-2">Oto nikan ti mummy so mi oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Iwo lo so mi'n Johnny oh</h6>
<h6 class="whiteShad text-center text-white pt-2">As I start to dey feel her body oh</h6>
<h6 class="whiteShad text-center text-white pt-2">She don dey feel my own</h6>
<h6 class="whiteShad text-center text-white pt-2">Monica come my house for the practical</h6>
<h6 class="whiteShad text-center text-white pt-2">The way she leave the girl critical</h6>
<h6 class="whiteShad text-center text-white pt-2">She wan finish me spiritual, physical</h6>
<h6 class="whiteShad text-center text-white pt-2">I no dey dey okay if I no dey see her</h6>
<h6 class="whiteShad text-center text-white pt-2">Me tell her say, sho de ma josi?</h6>
<h6 class="whiteShad text-center text-white pt-2">Sho de ma josi? Yeah Yeah Yeah Yeah</h6>
<h6 class="whiteShad text-center text-white pt-2">Make a man jonzing</h6>
<h6 class="whiteShad text-center text-white pt-2">You make a man jonzing. Yeah Yeah Yeah Yeah</h6>
<h6 class="whiteShad text-center text-white pt-2">Orin mi lon josi, orin mi lon josi</h6>
<h6 class="whiteShad text-center text-white pt-2">Osha rimi bi mo she'n korin bi wizzy baby oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Komagbon komagbon</h6>
<h6 class="whiteShad text-center text-white pt-2">Komagbon komagbon komagbon</h6>
<h6 class="whiteShad text-center text-white pt-2">Komagbon komagbon</h6>
<h6 class="whiteShad text-center text-white pt-2">Je koma, je koma, je komagbon</h6>
<h6 class="whiteShad text-center text-white pt-2">Komagbon komagbon</h6>
<h6 class="whiteShad text-center text-white pt-2">Komagbon komagbon komagbon</h6>
<h6 class="whiteShad text-center text-white pt-2">Komagbon komagbon</h6>
<h6 class="whiteShad text-center text-white pt-2">Je koma, je koma, je komagbon</h6>
<h6 class="whiteShad text-center text-white pt-2">Ofapa jo, ofese jo</h6>
<h6 class="whiteShad text-center text-white pt-2">Ofijosi, ofitan mo</h6>
<h6 class="whiteShad text-center text-white pt-2">Ofapa mo, ofagbadayo</h6>
<h6 class="whiteShad text-center text-white pt-2">...</h6>
<h6 class="whiteShad text-center text-white pt-2">It's D A 2 d M O</h6>`

const lyricsCumeAlong = `
<h6 class="whiteShad text-center text-white pt-2">Uhn it's D A 2 d M O</h6>
<h6 class="whiteShad text-center text-white pt-2">Cume on cume on, baby Esther</h6>
<h6 class="whiteShad text-center text-white pt-2">Mamacita, seniorita</h6>
<h6 class="whiteShad text-center text-white pt-2">Temi ba ti ri eh sha lemi sha ma'n jo</h6>
<h6 class="whiteShad text-center text-white pt-2">Temi ba ti ri eh sha lemi sha ma'n flow</h6>
<h6 class="whiteShad text-center text-white pt-2">Omo na you make my thing go slow</h6>
<h6 class="whiteShad text-center text-white pt-2">Omo na you make my thing go slow</h6>
<h6 class="whiteShad text-center text-white pt-2">She said her body feeling so funny oh</h6>
<h6 class="whiteShad text-center text-white pt-2">She said she needs a Doctor me oh</h6>
<h6 class="whiteShad text-center text-white pt-2">I pour some oil on her body oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Mo sofun ko sikan to kan mi oh</h6>
<h6 class="whiteShad text-center text-white pt-2">As I start to dey feel her body oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Oni Damodotun Ma kpa mi oh</h6>
<h6 class="whiteShad text-center text-white pt-2">I pour some oil on her body oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Mo sofun ko sikan to kan mi oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby girl cume along</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby girl cume along</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby girl cume along</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby girl cume along</h6>
<h6 class="whiteShad text-center text-white pt-2">She said she wanting more</h6>
<h6 class="whiteShad text-center text-white pt-2">She said she wanting more</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby girl cume along</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby girl cume along</h6>
<h6 class="whiteShad text-center text-white pt-2">Cume on cume on, baby Esther</h6>
<h6 class="whiteShad text-center text-white pt-2">Mamacita, seniorita</h6>
<h6 class="whiteShad text-center text-white pt-2">Temi ba ti ri eh sha lemi sha ma'n jo</h6>
<h6 class="whiteShad text-center text-white pt-2">Temi ba ti ri eh sha lemi sha ma'n flow</h6>
<h6 class="whiteShad text-center text-white pt-2">Omo na you make my thing go slow</h6>
<h6 class="whiteShad text-center text-white pt-2">Omo na you make my thing go slow</h6>
<h6 class="whiteShad text-center text-white pt-2">Damo lon flow, je ka jo jo</h6>
<h6 class="whiteShad text-center text-white pt-2">Loju agbo yeah yeah yeah</h6>
<h6 class="whiteShad text-center text-white pt-2">She said her body feeling so funny oh</h6>
<h6 class="whiteShad text-center text-white pt-2">She said she needs a Doctor me oh</h6>
<h6 class="whiteShad text-center text-white pt-2">I pour some oil on her body oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Mo sofun ko sikan to kan mi oh</h6>
<h6 class="whiteShad text-center text-white pt-2">As I start to dey feel her body oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Oni Damodotun Ma kpa mi oh</h6>
<h6 class="whiteShad text-center text-white pt-2">I pour some oil on her body oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Mo sofun ko sikan to kan mi oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby girl cume along</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby girl cume along</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby girl cume along</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby girl cume along</h6>
<h6 class="whiteShad text-center text-white pt-2">She said she wanting more</h6>
<h6 class="whiteShad text-center text-white pt-2">She said she wanting more</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby girl cume along</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby girl cume along</h6>
<h6 class="whiteShad text-center text-white pt-2">Blessing tin ba kpayin</h6>
<h6 class="whiteShad text-center text-white pt-2">Make you tell my mommy</h6>
<h6 class="whiteShad text-center text-white pt-2">Kpe iwo gan loma kpa mi</h6>
<h6 class="whiteShad text-center text-white pt-2">Iwo gan loma kpa mi oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Make you tell my daddy</h6>
<h6 class="whiteShad text-center text-white pt-2">Make you tell my mummy</h6>
<h6 class="whiteShad text-center text-white pt-2">Kpe iwo gan loma kpa mi</h6>
<h6 class="whiteShad text-center text-white pt-2">Iwo gan loma kpa mi oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Shey you feeling my shii</h6>
<h6 class="whiteShad text-center text-white pt-2">I swear that I'm feeling your shii</h6>
<h6 class="whiteShad text-center text-white pt-2">Uhn Uhn Uhn Uhn, that's my shii</h6>
<h6 class="whiteShad text-center text-white pt-2">And my shii is your shii, you know</h6>
<h6 class="whiteShad text-center text-white pt-2">Feeling my shii, uhn uhn uhn uhn</h6>`

const lyricsWantingMore = `
<h6 class="whiteShad text-center text-white pt-2">Uhn uhn uhn uhn</h6>
<h6 class="whiteShad text-center text-white pt-2">Uhn uhn uhn uhn</h6>
<h6 class="whiteShad text-center text-white pt-2">Uhn uhn uhn uhn</h6>
<h6 class="whiteShad text-center text-white pt-2">Uhn uhn uhn uhn</h6>
<h6 class="whiteShad text-center text-white pt-2">It's D A 2 d M O</h6>
<h6 class="whiteShad text-center text-white pt-2">Uhn uhn uhn uhn</h6>
<h6 class="whiteShad text-center text-white pt-2">Wanting it more</h6>
<h6 class="whiteShad text-center text-white pt-2">Girl I'm wanting it more</h6>
<h6 class="whiteShad text-center text-white pt-2">Wanting more, wanting it more</h6>
<h6 class="whiteShad text-center text-white pt-2">Wanting more, girl I'm wanting it more</h6>
<h6 class="whiteShad text-center text-white pt-2">Wanting more</h6>
<h6 class="whiteShad text-center text-white pt-2">Wanting it more</h6>
<h6 class="whiteShad text-center text-white pt-2">Girl I'm wanting it more</h6>
<h6 class="whiteShad text-center text-white pt-2">Wanting more, girl I'm wanting it more</h6>
<h6 class="whiteShad text-center text-white pt-2">Wanting more, girl I'm wanting more</h6>
<h6 class="whiteShad text-center text-white pt-2">Wanting more</h6>
<h6 class="whiteShad text-center text-white pt-2">She said Damodotun makes me dance</h6>
<h6 class="whiteShad text-center text-white pt-2">Girl your body makes me craze</h6>
<h6 class="whiteShad text-center text-white pt-2">I been telling you my bae</h6>
<h6 class="whiteShad text-center text-white pt-2">Ngba tokin sh'omode</h6>
<h6 class="whiteShad text-center text-white pt-2">Oya whine am go low</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby whine am go low</h6>
<h6 class="whiteShad text-center text-white pt-2">Isale ma nijo wa</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby mi ma nisho ah</h6>
<h6 class="whiteShad text-center text-white pt-2">Like the way you dance to the konga oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby lo maje oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Jo rora ma shey oh</h6>
<h6 class="whiteShad text-center text-white pt-2">You ten over ten oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby mi ko baje oh</h6>
<h6 class="whiteShad text-center text-white pt-2">She said Damodotun makes me dance</h6>
<h6 class="whiteShad text-center text-white pt-2">Girl your body makes me craze</h6>
<h6 class="whiteShad text-center text-white pt-2">I been telling you my bae</h6>
<h6 class="whiteShad text-center text-white pt-2">Ngba tokin sh'omode</h6>
<h6 class="whiteShad text-center text-white pt-2">Wanting it more</h6>
<h6 class="whiteShad text-center text-white pt-2">Girl I'm wanting it more</h6>
<h6 class="whiteShad text-center text-white pt-2">Wanting more, wanting it more</h6>
<h6 class="whiteShad text-center text-white pt-2">Wanting more, girl I'm wanting it more</h6>
<h6 class="whiteShad text-center text-white pt-2">Wanting more</h6>
<h6 class="whiteShad text-center text-white pt-2">Wanting it more</h6>
<h6 class="whiteShad text-center text-white pt-2">Girl I'm wanting it more</h6>
<h6 class="whiteShad text-center text-white pt-2">Wanting more, girl I'm wanting it more</h6>
<h6 class="whiteShad text-center text-white pt-2">Wanting more, girl I'm wanting more</h6>
<h6 class="whiteShad text-center text-white pt-2">Wanting more</h6>
<h6 class="whiteShad text-center text-white pt-2">Oya baby girl fowo mugana</h6>
<h6 class="whiteShad text-center text-white pt-2">Everytime she dey demand attention</h6>
<h6 class="whiteShad text-center text-white pt-2">Me I start to dey give her the gan gan</h6>
<h6 class="whiteShad text-center text-white pt-2">Emi ti mio ma kin shey Bolo</h6>
<h6 class="whiteShad text-center text-white pt-2">Ani everytime ti baby ba lo</h6>
<h6 class="whiteShad text-center text-white pt-2">Everyday me I no dey see color</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby na you dey give me color</h6>
<h6 class="whiteShad text-center text-white pt-2">Iwo gan loma fun mi lopolo</h6>
<h6 class="whiteShad text-center text-white pt-2">Ahnnn wanting it more ...</h6>`

const lyricsFckedUp = `
<h6 class="whiteShad text-center text-white pt-2">Uhn M O</h6>
<h6 class="whiteShad text-center text-white pt-2">You know what we do</h6>
<h6 class="whiteShad text-center text-white pt-2">Fine girl with nonsense sense of humor</h6>
<h6 class="whiteShad text-center text-white pt-2">You told me you loved me</h6>
<h6 class="whiteShad text-center text-white pt-2">But thats a rumor</h6>
<h6 class="whiteShad text-center text-white pt-2">You fcked up, allow me to tell on you joor</h6>
<h6 class="whiteShad text-center text-white pt-2">I locked up, you know me, I care less</h6>
<h6 class="whiteShad text-center text-white pt-2">The reason we texting</h6>
<h6 class="whiteShad text-center text-white pt-2">Was so you could secs me</h6>
<h6 class="whiteShad text-center text-white pt-2">But you didn't impress me</h6>
<h6 class="whiteShad text-center text-white pt-2">Take a jet ski</h6>
<h6 class="whiteShad text-center text-white pt-2">Out to the westies</h6>
<h6 class="whiteShad text-center text-white pt-2">Get out of my sight please</h6>
<h6 class="whiteShad text-center text-white pt-2">You fcked another, you didn't invite me</h6>
<h6 class="whiteShad text-center text-white pt-2">Could have been exciting</h6>
<h6 class="whiteShad text-center text-white pt-2">Mo de ti ge dada</h6>
<h6 class="whiteShad text-center text-white pt-2">For your roundabout</h6>
<h6 class="whiteShad text-center text-white pt-2">You dey fck around</h6>
<h6 class="whiteShad text-center text-white pt-2">Don dey go down</h6>
<h6 class="whiteShad text-center text-white pt-2">Because of naira</h6>
<h6 class="whiteShad text-center text-white pt-2">Now you gat me fcked up</h6>
<h6 class="whiteShad text-center text-white pt-2">And I know what's up</h6>
<h6 class="whiteShad text-center text-white pt-2">Na because say you too like money</h6>
<h6 class="whiteShad text-center text-white pt-2">Iru yin ma wopo</h6>
<h6 class="whiteShad text-center text-white pt-2">Getting guys fcked up</h6>
<h6 class="whiteShad text-center text-white pt-2">All because say you too like money</h6>
<h6 class="whiteShad text-center text-white pt-2">Now you gat me fcked up totally ahnn</h6>
<h6 class="whiteShad text-center text-white pt-2">Totally ahnnn, totally</h6>
<h6 class="whiteShad text-center text-white pt-2">Now you gat me fcked up totally ahnn</h6>
<h6 class="whiteShad text-center text-white pt-2">Totally ahnnn, totally</h6>
<h6 class="whiteShad text-center text-white pt-2">Now you gat me fcked up totally ahnn</h6>
<h6 class="whiteShad text-center text-white pt-2">Totally ahnnn, totally</h6>`

const lyricsMind = `
<h6 class="whiteShad text-center text-white pt-2">For your mind</h6>
<h6 class="whiteShad text-center text-white pt-2">You think that I don't mind</h6>
<h6 class="whiteShad text-center text-white pt-2">But girl I really mind</h6>
<h6 class="whiteShad text-center text-white pt-2">Cos you been on my mind</h6>
<h6 class="whiteShad text-center text-white pt-2">In your defence</h6>
<h6 class="whiteShad text-center text-white pt-2">You like guys ton gun benz</h6>
<h6 class="whiteShad text-center text-white pt-2">Been juggling my sense</h6>
<h6 class="whiteShad text-center text-white pt-2">The feeling is intense</h6>
<h6 class="whiteShad text-center text-white pt-2">I'm really high, I'm far away</h6>
<h6 class="whiteShad text-center text-white pt-2">What is gone girl is past away</h6>
<h6 class="whiteShad text-center text-white pt-2">Je ka rira ni Saturday</h6>
<h6 class="whiteShad text-center text-white pt-2">Dakun jo ma tan mi oh</h6> 
<h6 class="whiteShad text-center text-white pt-2">I'm really high, I'm far away</h6>
<h6 class="whiteShad text-center text-white pt-2">What is gone girl is past away</h6>
<h6 class="whiteShad text-center text-white pt-2">Je ka rira ni Saturday</h6>
<h6 class="whiteShad text-center text-white pt-2">Dakun jo ma tan mi oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Al'omo yen ti noh noh</h6>
<h6 class="whiteShad text-center text-white pt-2">Feeling so fly kalo koro</h6>
<h6 class="whiteShad text-center text-white pt-2">Awon toh ma deck eh wanbi, in my zone</h6>
<h6 class="whiteShad text-center text-white pt-2">Mami just feeling so fly on her own</h6>
<h6 class="whiteShad text-center text-white pt-2">Girl sunmomi ka combine</h6>
<h6 class="whiteShad text-center text-white pt-2">Nkan to gbe seyin detu kpo bayi</h6>
<h6 class="whiteShad text-center text-white pt-2">Mami don't stop that thing</h6>
<h6 class="whiteShad text-center text-white pt-2">Otun yi bayi</h6>
<h6 class="whiteShad text-center text-white pt-2">Omo tan nimi and you know I'm hard to come by</h6>
<h6 class="whiteShad text-center text-white pt-2">For your mind</h6>
<h6 class="whiteShad text-center text-white pt-2">You think that I don't mind</h6>
<h6 class="whiteShad text-center text-white pt-2">But girl I really mind</h6>
<h6 class="whiteShad text-center text-white pt-2">Cos you been on my mind</h6>
<h6 class="whiteShad text-center text-white pt-2">In your defence</h6>
<h6 class="whiteShad text-center text-white pt-2">You like guys ton gun benz</h6>
<h6 class="whiteShad text-center text-white pt-2">Been juggling my sense</h6>
<h6 class="whiteShad text-center text-white pt-2">The feeling is intense</h6>
<h6 class="whiteShad text-center text-white pt-2">I'm really high, I'm far away</h6>
<h6 class="whiteShad text-center text-white pt-2">What is gone girl is past away</h6>
<h6 class="whiteShad text-center text-white pt-2">Je ka rira ni Saturday</h6>
<h6 class="whiteShad text-center text-white pt-2">Dakun jo ma tan mi oh</h6> 
<h6 class="whiteShad text-center text-white pt-2">I'm really high, I'm far away</h6>
<h6 class="whiteShad text-center text-white pt-2">What is gone girl is past away</h6>
<h6 class="whiteShad text-center text-white pt-2">Je ka rira ni Saturday</h6>
<h6 class="whiteShad text-center text-white pt-2">Dakun jo ma tan mi oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Omo me I no fi take my mind off your body</h6>
<h6 class="whiteShad text-center text-white pt-2">I never really been with a baddie</h6>
<h6 class="whiteShad text-center text-white pt-2">Jo gbe mi sokan Sade</h6>
<h6 class="whiteShad text-center text-white pt-2">How would you like to get high</h6>
<h6 class="whiteShad text-center text-white pt-2">With me my shorty</h6>
<h6 class="whiteShad text-center text-white pt-2">Some smokes and deligent foreplay</h6>
<h6 class="whiteShad text-center text-white pt-2">Just be my only chargie</h6>
<h6 class="whiteShad text-center text-white pt-2">La la la, lo lo lo</h6>
<h6 class="whiteShad text-center text-white pt-2">What you did to me I don't know</h6>
<h6 class="whiteShad text-center text-white pt-2">What's on my mind, is all sorrow</h6>
<h6 class="whiteShad text-center text-white pt-2">Ghetto boy gotta hustle to chop oh</h6>`

const lyricsOshey = `
<h6 class="whiteShad text-center text-white pt-2">It's D A 2 d M O</h6>
<h6 class="whiteShad text-center text-white pt-2">I said be mine</h6>
<h6 class="whiteShad text-center text-white pt-2">Everytime you dey decline</h6>
<h6 class="whiteShad text-center text-white pt-2">She like the guy</h6>
<h6 class="whiteShad text-center text-white pt-2">But she too dey fear musicians</h6>
<h6 class="whiteShad text-center text-white pt-2">I no dey lie</h6>
<h6 class="whiteShad text-center text-white pt-2">Trust me baby you'll be fine</h6>
<h6 class="whiteShad text-center text-white pt-2">Je ka combine</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby girl no dey waste time</h6>
<h6 class="whiteShad text-center text-white pt-2">Oshey oh, oshey oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Boshe n'shey koma shey oh</h6>
<h6 class="whiteShad text-center text-white pt-2">My la oh, lady oh</h6> 
<h6 class="whiteShad text-center text-white pt-2">You're making my day oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Aje oh, mogbe oh</h6>
<h6 class="whiteShad text-center text-white pt-2">There's nothing that you can say oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Lade oh, lade oh</h6>
<h6 class="whiteShad text-center text-white pt-2">You must to be my bae oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Sho ma kpami</h6>
<h6 class="whiteShad text-center text-white pt-2">Fun mother me</h6>
<h6 class="whiteShad text-center text-white pt-2">Oh rita me</h6>
<h6 class="whiteShad text-center text-white pt-2">I'll be all I can be</h6>
<h6 class="whiteShad text-center text-white pt-2">I like it</h6>
<h6 class="whiteShad text-center text-white pt-2">Girl you must to ginger me</h6>
<h6 class="whiteShad text-center text-white pt-2">Iwo ati tani</h6>
<h6 class="whiteShad text-center text-white pt-2">No dey form you must to ginger me oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Oh I want money</h6>
<h6 class="whiteShad text-center text-white pt-2">If I no get money</h6>
<h6 class="whiteShad text-center text-white pt-2">Bobo no dey happy</h6>
<h6 class="whiteShad text-center text-white pt-2">Them no go fit to gum body</h6>
<h6 class="whiteShad text-center text-white pt-2">Girly your body</h6>
<h6 class="whiteShad text-center text-white pt-2">Ogbodo je temi</h6>
<h6 class="whiteShad text-center text-white pt-2">Boshe n'shey dunmomi</h6>
<h6 class="whiteShad text-center text-white pt-2">You can take my money</h6>
<h6 class="whiteShad text-center text-white pt-2">It's Dj Great</h6>
<h6 class="whiteShad text-center text-white pt-2">With D A 2 d M O</h6>
<h6 class="whiteShad text-center text-white pt-2">You know how we do it</h6>
<h6 class="whiteShad text-center text-white pt-2">Shake it up uhn, shake it up uhn</h6> 
<h6 class="whiteShad text-center text-white pt-2">Shake it up ah</h6>
<h6 class="whiteShad text-center text-white pt-2">Shake it up uhn</h6>
<h6 class="whiteShad text-center text-white pt-2">Shake it up, shake it up, shake it up</h6>
<h6 class="whiteShad text-center text-white pt-2">Ahhh mogbe oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Mami what is wrong with you?</h6>
<h6 class="whiteShad text-center text-white pt-2">You told me you were coming through</h6>
<h6 class="whiteShad text-center text-white pt-2">I been waiting for you</h6>
<h6 class="whiteShad text-center text-white pt-2">You told me you were coming through</h6>
<h6 class="whiteShad text-center text-white pt-2">Oshey oh, oshey oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Boshe n'shey koma shey oh</h6>
<h6 class="whiteShad text-center text-white pt-2">My la oh, lady oh</h6> 
<h6 class="whiteShad text-center text-white pt-2">You're making my day oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Aje oh, mogbe oh</h6>
<h6 class="whiteShad text-center text-white pt-2">There's nothing that you can say oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Lade oh, lade oh</h6>
<h6 class="whiteShad text-center text-white pt-2">You must to be my bae</h6>
<h6 class="whiteShad text-center text-white pt-2">Oshey oh, oshey oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Boshe n'shey koma shey oh</h6>
<h6 class="whiteShad text-center text-white pt-2">My la oh, lady oh</h6> 
<h6 class="whiteShad text-center text-white pt-2">You're making my day oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Aje oh, mogbe oh</h6>
<h6 class="whiteShad text-center text-white pt-2">There's nothing that you can say oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Lade oh, lade oh</h6>
<h6 class="whiteShad text-center text-white pt-2">You must to be my bae</h6>`

const lyricsMajo = `
<h6 class="whiteShad text-center text-white pt-2">It's D A 2 d M O</h6>
<h6 class="whiteShad text-center text-white pt-2">You know what we do, what we do</h6>
<h6 class="whiteShad text-center text-white pt-2">Oshey oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Every little you dey do me oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Odape moti mezebu ni oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Girly na your body fit to cool me oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Tin ba ti soro mi koma gbo mi oh ah</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh ah</h6>
<h6 class="whiteShad text-center text-white pt-2">Ole kpe mi'n commando</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh</h6>
<h6 class="whiteShad text-center text-white pt-2">I said i got a lot of distraction</h6>
<h6 class="whiteShad text-center text-white pt-2">I never know the one to call my own</h6> 
<h6 class="whiteShad text-center text-white pt-2">Kori mummy mi ko deliver me oh</h6>
<h6 class="whiteShad text-center text-white pt-2">These girls want to chop cucumber mi oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Now let us talk about Sumbo</h6>
<h6 class="whiteShad text-center text-white pt-2">Kiniyen tobi ni mo shey sunmo</h6>
<h6 class="whiteShad text-center text-white pt-2">Girly your body dun ju Tobacco lo</h6>
<h6 class="whiteShad text-center text-white pt-2">Make you no go do me like Steff London</h6>
<h6 class="whiteShad text-center text-white pt-2">Chimi chimi yanga go low</h6>
<h6 class="whiteShad text-center text-white pt-2">Ti mo ti gba coco coco co oh</h6>
<h6 class="whiteShad text-center text-white pt-2">She temme say oh no oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Molly dey my body oh no no no no</h6>
<h6 class="whiteShad text-center text-white pt-2">Girl I no fi think your own</h6>
<h6 class="whiteShad text-center text-white pt-2">All I can think about is my own</h6>
<h6 class="whiteShad text-center text-white pt-2">Tin ba ti ni ko ma jo oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni Moni ko ma gbo oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh ah</h6>
<h6 class="whiteShad text-center text-white pt-2">Ole kpe mi'n commando</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh</h6>
<h6 class="whiteShad text-center text-white pt-2">I no send</h6>
<h6 class="whiteShad text-center text-white pt-2">I just want you in my bed</h6>
<h6 class="whiteShad text-center text-white pt-2">There's no end</h6>
<h6 class="whiteShad text-center text-white pt-2">To the loving you would get</h6>
<h6 class="whiteShad text-center text-white pt-2">I would never do you bad</h6>
<h6 class="whiteShad text-center text-white pt-2">Do like that</h6>
<h6 class="whiteShad text-center text-white pt-2">Sofun won kan ma lo be oh</h6>
<h6 class="whiteShad text-center text-white pt-2">On my head, girly moma cover eh</h6>
<h6 class="whiteShad text-center text-white pt-2">Sope kan ma shey bayen</h6>
<h6 class="whiteShad text-center text-white pt-2">You no fi sabi as he dey do me oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Every damn time you dey choose me oh</h6> 
<h6 class="whiteShad text-center text-white pt-2">Otun wole kajo kalaku ni oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Rora shey mi baby ki ma kuri oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Every little you dey do me oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Odape moti mezebu ni oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Girly na your body fit to cool me oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Tin ba ti soro mi koma gbo mi oh ah</h6>
<h6 class="whiteShad text-center text-white pt-2">She be screaming come and do oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Wole baby go down low</h6>
<h6 class="whiteShad text-center text-white pt-2">Until you kill commando</h6>
<h6 class="whiteShad text-center text-white pt-2">You no fi commando oh ah</h6>
<h6 class="whiteShad text-center text-white pt-2">She be giving me that tone</h6>
<h6 class="whiteShad text-center text-white pt-2">Go low baby ko gba shan oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Feel your body on my own</h6>
<h6 class="whiteShad text-center text-white pt-2">Love your body on my own</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni Moni ko ma gbo oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh ah</h6>
<h6 class="whiteShad text-center text-white pt-2">Ole kpe mi'n commando</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni moni komajo oh</h6>`

const lyricsBootyCall = `
<h6 class="whiteShad text-center text-white pt-2">Jigga man, Jigga Man</h6>
<h6 class="whiteShad text-center text-white pt-2">Shey you don see jigga man</h6>
<h6 class="whiteShad text-center text-white pt-2">Jigga man, jigga man</h6>
<h6 class="whiteShad text-center text-white pt-2">Shey you like jigga man</h6>
<h6 class="whiteShad text-center text-white pt-2">Booty call</h6>
<h6 class="whiteShad text-center text-white pt-2">Your booty, your booty, call on me</h6>
<h6 class="whiteShad text-center text-white pt-2">Booty call</h6>
<h6 class="whiteShad text-center text-white pt-2">Your booty, your booty call on me</h6>
<h6 class="whiteShad text-center text-white pt-2">Booty call</h6>
<h6 class="whiteShad text-center text-white pt-2">Ofe je ka jolo shey kinikan</h6>
<h6 class="whiteShad text-center text-white pt-2">The way you whine it all up on me girl</h6>
<h6 class="whiteShad text-center text-white pt-2">Your body, your body, your body kpoor gan ni</h6>
<h6 class="whiteShad text-center text-white pt-2">What's up with that thing?</h6>
<h6 class="whiteShad text-center text-white pt-2">Otobi that thing</h6>
<h6 class="whiteShad text-center text-white pt-2">The way she ginger me</h6>
<h6 class="whiteShad text-center text-white pt-2">She wan chop that thing</h6>
<h6 class="whiteShad text-center text-white pt-2">That thing, otobi that thing</h6> 
<h6 class="whiteShad text-center text-white pt-2">The way she ginger me</h6>
<h6 class="whiteShad text-center text-white pt-2">She wan chop that thing</h6>
<h6 class="whiteShad text-center text-white pt-2">She want attention</h6>
<h6 class="whiteShad text-center text-white pt-2">I give her the attention</h6>
<h6 class="whiteShad text-center text-white pt-2">Your body get tension</h6>
<h6 class="whiteShad text-center text-white pt-2">No killy me with pressure</h6>
<h6 class="whiteShad text-center text-white pt-2">Your body deh ma lole</h6>
<h6 class="whiteShad text-center text-white pt-2">You no go fi stand with that your leg</h6>
<h6 class="whiteShad text-center text-white pt-2">This no be threat but oma lole</h6>
<h6 class="whiteShad text-center text-white pt-2">The way you give me that connect</h6>
<h6 class="whiteShad text-center text-white pt-2">Booty call</h6>
<h6 class="whiteShad text-center text-white pt-2">Your booty, your booty, call on me</h6>
<h6 class="whiteShad text-center text-white pt-2">Booty call</h6>
<h6 class="whiteShad text-center text-white pt-2">Your booty, your booty call on me</h6>
<h6 class="whiteShad text-center text-white pt-2">Booty call</h6>
<h6 class="whiteShad text-center text-white pt-2">Ofe je ka jolo shey kinikan</h6>
<h6 class="whiteShad text-center text-white pt-2">The way you whine it all up on me girl</h6>
<h6 class="whiteShad text-center text-white pt-2">Your body, your body, your body kpoor gan ni</h6>
<h6 class="whiteShad text-center text-white pt-2">What's up with that thing?</h6>
<h6 class="whiteShad text-center text-white pt-2">Otobi that thing</h6>
<h6 class="whiteShad text-center text-white pt-2">The way she ginger me</h6>
<h6 class="whiteShad text-center text-white pt-2">She wan chop that thing</h6>
<h6 class="whiteShad text-center text-white pt-2">That thing, otobi that thing</h6> 
<h6 class="whiteShad text-center text-white pt-2">The way she ginger me</h6>
<h6 class="whiteShad text-center text-white pt-2">She wan chop that thing</h6>
<h6 class="whiteShad text-center text-white pt-2">The money too much I'm dashing</h6>
<h6 class="whiteShad text-center text-white pt-2">Are you feeling my singing</h6>
<h6 class="whiteShad text-center text-white pt-2">Buy whatever you're thinking</h6>
<h6 class="whiteShad text-center text-white pt-2">Can't you see that I'm singing</h6>
<h6 class="whiteShad text-center text-white pt-2">She just dey making man singing</h6>
<h6 class="whiteShad text-center text-white pt-2">She said  she likes my body</h6>
<h6 class="whiteShad text-center text-white pt-2">She start to touch my body</h6>
<h6 class="whiteShad text-center text-white pt-2">She said her mind is horny gan</h6>
<h6 class="whiteShad text-center text-white pt-2">Halimat,no be me dey give you molly chop</h6>
<h6 class="whiteShad text-center text-white pt-2">Is that why you always wanting more</h6>
<h6 class="whiteShad text-center text-white pt-2">Ori mummy mi ma lo ko mi yo</h6>
<h6 class="whiteShad text-center text-white pt-2">Booty call</h6>
<h6 class="whiteShad text-center text-white pt-2">Your booty, your booty, call on me</h6>
<h6 class="whiteShad text-center text-white pt-2">Booty call</h6>
<h6 class="whiteShad text-center text-white pt-2">Your booty, your booty call on me</h6>
<h6 class="whiteShad text-center text-white pt-2">Booty call</h6>
<h6 class="whiteShad text-center text-white pt-2">Ofe je ka jolo shey kinikan</h6>
<h6 class="whiteShad text-center text-white pt-2">The way you whine it all up on me girl</h6>
<h6 class="whiteShad text-center text-white pt-2">Your body, your body, your body kpoor gan ni</h6>
<h6 class="whiteShad text-center text-white pt-2">This kind booty</h6>
<h6 class="whiteShad text-center text-white pt-2">This boy feel it</h6>
<h6 class="whiteShad text-center text-white pt-2">The gbedu is too banging girl, ain't it?</h6>
<h6 class="whiteShad text-center text-white pt-2">This company, love your company</h6>
<h6 class="whiteShad text-center text-white pt-2">If it ain't you then ara ma kan mi</h6>
<h6 class="whiteShad text-center text-white pt-2">This kind booty</h6>
<h6 class="whiteShad text-center text-white pt-2">This boy feel it</h6>
<h6 class="whiteShad text-center text-white pt-2">The gbedu is too banging girl, ain't it?</h6>
<h6 class="whiteShad text-center text-white pt-2">This company, love your company</h6>
<h6 class="whiteShad text-center text-white pt-2">If it ain't you then ara ma kan mi</h6>`

const lyricsBolo = `
<h6 class="whiteShad text-center text-white pt-2">Oma le kpe mi Bolo</h6>
<h6 class="whiteShad text-center text-white pt-2">I'm feeling your body on my own</h6>
<h6 class="whiteShad text-center text-white pt-2">I'm liking your body on my own</h6>
<h6 class="whiteShad text-center text-white pt-2">She said she likes it on a low</h6>
<h6 class="whiteShad text-center text-white pt-2">Me sef i like it on a low</h6>
<h6 class="whiteShad text-center text-white pt-2">You gat the juice, gat the sauce</h6>
<h6 class="whiteShad text-center text-white pt-2">Oh baby lomo na</h6>
<h6 class="whiteShad text-center text-white pt-2">You're the ganja in my raw</h6>
<h6 class="whiteShad text-center text-white pt-2">The way you shake it oh my God</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby don dey my door</h6>
<h6 class="whiteShad text-center text-white pt-2">She want to lick it on a raw</h6>
<h6 class="whiteShad text-center text-white pt-2">I been on my grind</h6>
<h6 class="whiteShad text-center text-white pt-2">Still tryna decide</h6>
<h6 class="whiteShad text-center text-white pt-2">I swear that I'm not high</h6>
<h6 class="whiteShad text-center text-white pt-2">You know i no fi lie</h6>
<h6 class="whiteShad text-center text-white pt-2">Oh my God, omoyen fimi kpa</h6>
<h6 class="whiteShad text-center text-white pt-2">Cos I no get kpa</h6> 
<h6 class="whiteShad text-center text-white pt-2">How i wan get kpa</h6>
<h6 class="whiteShad text-center text-white pt-2">Idi ti mo fi shey bi Bolo lo</h6>
<h6 class="whiteShad text-center text-white pt-2">Ni kobale mumi wo koro lo</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby girl show me your color lo</h6>
<h6 class="whiteShad text-center text-white pt-2">The way you dey do me that thing on God</h6>
<h6 class="whiteShad text-center text-white pt-2">Le le le le le</h6>
<h6 class="whiteShad text-center text-white pt-2">Le le le le le le le</h6>
<h6 class="whiteShad text-center text-white pt-2">Le le le le le le le</h6>
<h6 class="whiteShad text-center text-white pt-2">Le le le le le le le le le</h6>
<h6 class="whiteShad text-center text-white pt-2">Le le le le le</h6>
<h6 class="whiteShad text-center text-white pt-2">Le le le le le le le</h6>
<h6 class="whiteShad text-center text-white pt-2">Le le le le le le le</h6>
<h6 class="whiteShad text-center text-white pt-2">Le le le le le le le le le</h6>
<h6 class="whiteShad text-center text-white pt-2">Idi ti mo fi shey bi Bolo lo</h6>
<h6 class="whiteShad text-center text-white pt-2">Ni kobale mumi wo koro lo</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby girl show me your color lo</h6>
<h6 class="whiteShad text-center text-white pt-2">The way you dey do me that thing on God</h6>`

const lyricsKillaman = `
<h6 class="whiteShad text-center text-white pt-2">It's D A 2 d M O</h6>
<h6 class="whiteShad text-center text-white pt-2">Hmm oshey oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Shayo ma plenty repete</h6>
<h6 class="whiteShad text-center text-white pt-2">If you pop and cop my song</h6>
<h6 class="whiteShad text-center text-white pt-2">When they popping bottle ma la n'pop shepe</h6>
<h6 class="whiteShad text-center text-white pt-2">If money don dey, show them pepper</h6>
<h6 class="whiteShad text-center text-white pt-2">Le le le le le</h6>
<h6 class="whiteShad text-center text-white pt-2">Gbon di eh, gbon ri, kotu gbese</h6>
<h6 class="whiteShad text-center text-white pt-2">Ibadi eh loke le le le</h6>
<h6 class="whiteShad text-center text-white pt-2">Bo gboring mi koma jo sese oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Normally, normally</h6>
<h6 class="whiteShad text-center text-white pt-2">You know that i dont do like this</h6>
<h6 class="whiteShad text-center text-white pt-2">I step in the place</h6>
<h6 class="whiteShad text-center text-white pt-2">Everything go just turn to magic</h6>
<h6 class="whiteShad text-center text-white pt-2">Problems plenty wey go</h6>
<h6 class="whiteShad text-center text-white pt-2">Make you kpoli night and day</h6>
<h6 class="whiteShad text-center text-white pt-2">One man, one man down on the big money highway</h6> 
<h6 class="whiteShad text-center text-white pt-2">Something must to killaman</h6>
<h6 class="whiteShad text-center text-white pt-2">Killaman killaman till a man die</h6>
<h6 class="whiteShad text-center text-white pt-2">Make you just dey cool my</h6>
<h6 class="whiteShad text-center text-white pt-2">Cool my, cool my, cool my mind</h6>
<h6 class="whiteShad text-center text-white pt-2">Say everything go dey alright</h6>
<h6 class="whiteShad text-center text-white pt-2">Dey alright yeah yeah yeah</h6>
<h6 class="whiteShad text-center text-white pt-2">Make you just dey cool my</h6>
<h6 class="whiteShad text-center text-white pt-2">Cool my, cool my, cool my mind</h6>
<h6 class="whiteShad text-center text-white pt-2">Kenikan ma dun koko momi</h6>
<h6 class="whiteShad text-center text-white pt-2">I go still get money</h6>
<h6 class="whiteShad text-center text-white pt-2">Bo wun eh ko gbomi</h6>
<h6 class="whiteShad text-center text-white pt-2">All the shii that I do for money</h6>
<h6 class="whiteShad text-center text-white pt-2">I swear it's gon worth it</h6>
<h6 class="whiteShad text-center text-white pt-2">Efunmi leto mi</h6>
<h6 class="whiteShad text-center text-white pt-2">Shayo ma wa repete</h6>
<h6 class="whiteShad text-center text-white pt-2">Pop and cop my song</h6>
<h6 class="whiteShad text-center text-white pt-2">When they popping bottle ma la n'pop shepe</h6>
<h6 class="whiteShad text-center text-white pt-2">If money don dey, show them pepper</h6>
<h6 class="whiteShad text-center text-white pt-2">Le le le le le</h6>
<h6 class="whiteShad text-center text-white pt-2">Gbon di eh, gbon ri, kotu gbese</h6>
<h6 class="whiteShad text-center text-white pt-2">Ibadi eh loke oh</h6>
<h6 class="whiteShad text-center text-white pt-2">Ibadi eh loke ah</h6>
<h6 class="whiteShad text-center text-white pt-2">Normally, normally</h6>
<h6 class="whiteShad text-center text-white pt-2">You know that i dont do like this</h6>
<h6 class="whiteShad text-center text-white pt-2">I step in the place</h6>
<h6 class="whiteShad text-center text-white pt-2">Everything go just turn to magic</h6>
<h6 class="whiteShad text-center text-white pt-2">Problems plenty wey go</h6>
<h6 class="whiteShad text-center text-white pt-2">Make you kpoli night and day</h6>
<h6 class="whiteShad text-center text-white pt-2">One man, one man down on the big money highway</h6> 
<h6 class="whiteShad text-center text-white pt-2">Something must to killaman</h6>
<h6 class="whiteShad text-center text-white pt-2">Killaman killaman till a man die</h6>
<h6 class="whiteShad text-center text-white pt-2">Make you just dey cool my</h6>
<h6 class="whiteShad text-center text-white pt-2">Cool my, cool my, cool my mind</h6>
<h6 class="whiteShad text-center text-white pt-2">Say everything go dey alright</h6>
<h6 class="whiteShad text-center text-white pt-2">Dey alright yeah yeah yeah</h6>
<h6 class="whiteShad text-center text-white pt-2">Make you just dey cool my</h6>
<h6 class="whiteShad text-center text-white pt-2">Cool my, cool my, cool my mind</h6>
<h6 class="whiteShad text-center text-white pt-2">Killaman</h6>
<h6 class="whiteShad text-center text-white pt-2">Killaman killaman till a man die</h6>
<h6 class="whiteShad text-center text-white pt-2">Make you just dey cool my</h6>
<h6 class="whiteShad text-center text-white pt-2">Cool my, cool my, cool my mind</h6>
<h6 class="whiteShad text-center text-white pt-2">Say everything go dey alright</h6>
<h6 class="whiteShad text-center text-white pt-2">Dey alright yeah yeah yeah</h6>
<h6 class="whiteShad text-center text-white pt-2">Make you just dey cool my</h6>
<h6 class="whiteShad text-center text-white pt-2">Cool my, cool my, cool my mind</h6>`

const lyricsNobody = `
<h6 class="whiteShad text-center text-white pt-2">When nobody body</h6>
<h6 class="whiteShad text-center text-white pt-2">Want to tell me something</h6>
<h6 class="whiteShad text-center text-white pt-2">Because I no get something</h6>
<h6 class="whiteShad text-center text-white pt-2">I pray make i get something</h6>
<h6 class="whiteShad text-center text-white pt-2">The boy, the boy, the boy, the boy</h6>
<h6 class="whiteShad text-center text-white pt-2">Them no feel the boy</h6>
<h6 class="whiteShad text-center text-white pt-2">They wan kill the boy</h6>
<h6 class="whiteShad text-center text-white pt-2">I just wanna chiil with joy</h6>
<h6 class="whiteShad text-center text-white pt-2">Shey b'emina ma lowo</h6>
<h6 class="whiteShad text-center text-white pt-2">Shey b'emina ma lola</h6>
<h6 class="whiteShad text-center text-white pt-2">Baba ma je kin colo</h6>
<h6 class="whiteShad text-center text-white pt-2">And everybody polowo mi</h6>
<h6 class="whiteShad text-center text-white pt-2">Ma lowo</h6>
<h6 class="whiteShad text-center text-white pt-2">Shey b'emina ma lola</h6>
<h6 class="whiteShad text-center text-white pt-2">Baba ma je kin colo</h6>
<h6 class="whiteShad text-center text-white pt-2">And everybody polowo mi</h6>
<h6 class="whiteShad text-center text-white pt-2">When nobody body dey for me</h6>
<h6 class="whiteShad text-center text-white pt-2">I just wan dey for me</h6>
<h6 class="whiteShad text-center text-white pt-2">Been trying everything</h6>
<h6 class="whiteShad text-center text-white pt-2">But they don't seem to work for me</h6>
<h6 class="whiteShad text-center text-white pt-2">Uhnnn dey for me</h6> 
<h6 class="whiteShad text-center text-white pt-2">Nobody dey for me</h6>
<h6 class="whiteShad text-center text-white pt-2">Baba lo dey for me</h6>
<h6 class="whiteShad text-center text-white pt-2">Now I just wan make money</h6>
<h6 class="whiteShad text-center text-white pt-2">Ma lo ma de</h6>
<h6 class="whiteShad text-center text-white pt-2">Ibi ti mo ma de ni made</h6>
<h6 class="whiteShad text-center text-white pt-2">What you gon say</h6>
<h6 class="whiteShad text-center text-white pt-2">He be like say you all want to see crazy</h6>
<h6 class="whiteShad text-center text-white pt-2">Ma lo gbagbe</h6>
<h6 class="whiteShad text-center text-white pt-2">Baba lo da mi no dey downgrade</h6>
<h6 class="whiteShad text-center text-white pt-2">Mio n'shomode</h6>
<h6 class="whiteShad text-center text-white pt-2">Now I'm just gonna be making the money</h6>
<h6 class="whiteShad text-center text-white pt-2">When nobody body</h6>
<h6 class="whiteShad text-center text-white pt-2">Want to tell me something</h6>
<h6 class="whiteShad text-center text-white pt-2">Because I no get something</h6>
<h6 class="whiteShad text-center text-white pt-2">I pray make i get something</h6>
<h6 class="whiteShad text-center text-white pt-2">The boy, the boy, the boy, the boy</h6>
<h6 class="whiteShad text-center text-white pt-2">Them no feel the boy</h6>
<h6 class="whiteShad text-center text-white pt-2">They wan kill the boy</h6>
<h6 class="whiteShad text-center text-white pt-2">I just wanna chiil with joy</h6>
<h6 class="whiteShad text-center text-white pt-2">Shey b'emina ma lowo</h6>
<h6 class="whiteShad text-center text-white pt-2">Shey b'emina ma lola</h6>
<h6 class="whiteShad text-center text-white pt-2">Baba ma je kin colo</h6>
<h6 class="whiteShad text-center text-white pt-2">And everybody polowo mi</h6>
<h6 class="whiteShad text-center text-white pt-2">Ma lowo</h6>
<h6 class="whiteShad text-center text-white pt-2">Shey b'emina ma lola</h6>
<h6 class="whiteShad text-center text-white pt-2">Baba ma je kin colo</h6>
<h6 class="whiteShad text-center text-white pt-2">And everybody polowo mi</h6>
<h6 class="whiteShad text-center text-white pt-2">Won ni kin gbe body mi soke</h6>
<h6 class="whiteShad text-center text-white pt-2">Body mi soke</h6>
<h6 class="whiteShad text-center text-white pt-2">Body mi uhnnnn</h6>
<h6 class="whiteShad text-center text-white pt-2">Body mi soke</h6>
<h6 class="whiteShad text-center text-white pt-2">Aye mi mada</h6>
<h6 class="whiteShad text-center text-white pt-2">Mo ma jeun soke</h6>
<h6 class="whiteShad text-center text-white pt-2">Mummy mi it's okay</h6>
<h6 class="whiteShad text-center text-white pt-2">Ebami yi soke</h6>
<h6 class="whiteShad text-center text-white pt-2">Olorun, Oba ngbo</h6>
<h6 class="whiteShad text-center text-white pt-2">Won ajo, mol'ajo</h6>
<h6 class="whiteShad text-center text-white pt-2">Emi, commando</h6>
<h6 class="whiteShad text-center text-white pt-2">Premium on the beat ma jo</h6>
<h6 class="whiteShad text-center text-white pt-2">Olorun, Oba ngbo</h6>
<h6 class="whiteShad text-center text-white pt-2">Won ajo, mol'ajo</h6>
<h6 class="whiteShad text-center text-white pt-2">Emi, commando</h6>
<h6 class="whiteShad text-center text-white pt-2">Premium on the beat ma jo</h6>`

const lyricsBodyBag = `
<h6 class="whiteShad text-center text-white pt-2">Hmmmm ah eh eh</h6>
<h6 class="whiteShad text-center text-white pt-2">Your body banging</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby girl your body banging</h6>
<h6 class="whiteShad text-center text-white pt-2">Your body banging</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby girl your body banging</h6>
<h6 class="whiteShad text-center text-white pt-2">She like the song</h6>
<h6 class="whiteShad text-center text-white pt-2">She say I fresh, Mr D'banj</h6>
<h6 class="whiteShad text-center text-white pt-2">Don't leave me hanging</h6>
<h6 class="whiteShad text-center text-white pt-2">Baby don't leave me hanging</h6>
<h6 class="whiteShad text-center text-white pt-2">When she jam my sound</h6>
<h6 class="whiteShad text-center text-white pt-2">She dey dance like say</h6>
<h6 class="whiteShad text-center text-white pt-2">Her body ti pemeji</h6>
<h6 class="whiteShad text-center text-white pt-2">Feeling the sound</h6>
<h6 class="whiteShad text-center text-white pt-2">Omo mhen i don't know</h6>
<h6 class="whiteShad text-center text-white pt-2">What you doing tonight</h6>
<h6 class="whiteShad text-center text-white pt-2">Kowa ba mi tonight</h6>
<h6 class="whiteShad text-center text-white pt-2">Make you jogede with me tonight</h6>
<h6 class="whiteShad text-center text-white pt-2">And your body dey kill me why</h6>
<h6 class="whiteShad text-center text-white pt-2">Your body kpai me</h6>
<h6 class="whiteShad text-center text-white pt-2">Monica, she want to put for body bag</h6>
<h6 class="whiteShad text-center text-white pt-2">She want to put me for body bag</h6>
<h6 class="whiteShad text-center text-white pt-2">She want to put me for body bag</h6>
<h6 class="whiteShad text-center text-white pt-2">She want to put, she's so demonic ah</h6>
<h6 class="whiteShad text-center text-white pt-2">She want to put me for body bag</h6>
<h6 class="whiteShad text-center text-white pt-2">She want to put me for body bag</h6>
<h6 class="whiteShad text-center text-white pt-2">She want to put me for body bag</h6>
<h6 class="whiteShad text-center text-white pt-2">She want to put me</h6>
<h6 class="whiteShad text-center text-white pt-2">I get the body for your love</h6>
<h6 class="whiteShad text-center text-white pt-2">Emi omo ogbon</h6>
<h6 class="whiteShad text-center text-white pt-2">My head is strong like coconut</h6> 
<h6 class="whiteShad text-center text-white pt-2">I don dey your door mouth</h6>
<h6 class="whiteShad text-center text-white pt-2">Kilometer, she don sare attack mi knicker</h6>
<h6 class="whiteShad text-center text-white pt-2">She want to chop the penisula</h6>
<h6 class="whiteShad text-center text-white pt-2">But I no get the parameter</h6>
<h6 class="whiteShad text-center text-white pt-2">Omoshalewa loni kin majo</h6>
<h6 class="whiteShad text-center text-white pt-2">Your body bad and you know that I know</h6>
<h6 class="whiteShad text-center text-white pt-2">The way you keep it spinning like spinall</h6>
<h6 class="whiteShad text-center text-white pt-2">Your body bad and you know that I know</h6>
<h6 class="whiteShad text-center text-white pt-2">I know, booty so soft like pillow</h6>
<h6 class="whiteShad text-center text-white pt-2">The way she take it go low</h6>
<h6 class="whiteShad text-center text-white pt-2">She don turn me casanova eh</h6>
<h6 class="whiteShad text-center text-white pt-2">My body is cold and your body is colder</h6>
<h6 class="whiteShad text-center text-white pt-2">She like kporan and I load her</h6>
<h6 class="whiteShad text-center text-white pt-2">In ano' dimension, it is so dark</h6>
<h6 class="whiteShad text-center text-white pt-2">I'm on my way, I can't hold back</h6>
<h6 class="whiteShad text-center text-white pt-2">The way you treat me girl yi sh'oda</h6>
<h6 class="whiteShad text-center text-white pt-2">I fit to cry for your shoulder</h6>
<h6 class="whiteShad text-center text-white pt-2">That's my bottle of beer, you can hold that</h6>
<h6 class="whiteShad text-center text-white pt-2">Bartender should give me soda</h6>
<h6 class="whiteShad text-center text-white pt-2">Body body</h6>
<h6 class="whiteShad text-center text-white pt-2">Body kpoor ni</h6>
<h6 class="whiteShad text-center text-white pt-2">Chop my money</h6>
<h6 class="whiteShad text-center text-white pt-2">Body body</h6>
<h6 class="whiteShad text-center text-white pt-2">Body kpoor ni</h6>
<h6 class="whiteShad text-center text-white pt-2">Chop my money</h6>
<h6 class="whiteShad text-center text-white pt-2">Moni ka moni ka jo jo</h6>
<h6 class="whiteShad text-center text-white pt-2">Monica monica ko majo</h6>
<h6 class="whiteShad text-center text-white pt-2">She want to chop my choco</h6>
<h6 class="whiteShad text-center text-white pt-2">Me sef con be like commando</h6>
<h6 class="whiteShad text-center text-white pt-2">She say she like the bobo</h6>
<h6 class="whiteShad text-center text-white pt-2">The bobo gan go give her to</h6>
<h6 class="whiteShad text-center text-white pt-2">The way she handle my kponmo</h6>
<h6 class="whiteShad text-center text-white pt-2">Oni p'otidi dan dan dan</h6><h6 class="whiteShad text-center text-white pt-2">Monica, she want to put for body bag</h6>
<h6 class="whiteShad text-center text-white pt-2">She want to put me for body bag</h6>
<h6 class="whiteShad text-center text-white pt-2">She want to put me for body bag</h6>
<h6 class="whiteShad text-center text-white pt-2">She want to put, she's so demonic ah</h6>
<h6 class="whiteShad text-center text-white pt-2">She want to put me for body bag</h6>
<h6 class="whiteShad text-center text-white pt-2">She want to put me for body bag</h6>
<h6 class="whiteShad text-center text-white pt-2">She want to put me for body bag</h6>
<h6 class="whiteShad text-center text-white pt-2">She want to put me</h6>`

function showLyrics(event) {
    const clickedButton = event.target.closest('button');
    const songTitle = clickedButton.value;
    const lyricsShow = document.querySelector('.lyricsCont');

    // Map song titles to their lyrics variables
    const lyricsMap = {
        'On God': lyricsOnGod,
        'Ko Ma Gbon': lyricsKoMaGbon,
        'Cume Along': lyricsCumeAlong,
        'Wanting More': lyricsWantingMore,
        'Fcked Up': lyricsFckedUp,
        'Mind': lyricsMind,
        'Oshey': lyricsOshey,
        'Majo': lyricsMajo,
        'Booty Call': lyricsBootyCall,
        'Bolo': lyricsBolo,
        'Killaman': lyricsKillaman,
        'Nobody': lyricsNobody,
        'Body Bag': lyricsBodyBag
        // Add more mappings as needed for other songs
    };

    // Get the lyrics for the clicked song
    const lyrics = lyricsMap[songTitle];
    if (lyrics) {
        lyricsShow.innerHTML = lyrics;
    } else {
        lyricsShow.innerHTML = '<h6 class="whiteShad text-center text-white">Lyrics not available</h6>';
    }
    const lyricsDisplay = document.querySelector('.lyricsDisplay')
    songListed.style.display = `none`
    lyricsDisplay.style.display = `block`
    lyricsDisplay.style.transition = 'display 0.3s ease'
}


function cancLyricsDisp() {
    const lyricsDisplay = document.querySelector('.lyricsDisplay')
    lyricsDisplay.style.display = `none`
    lyricsDisplay.style.transition = 'display 0.3s ease'
    songListed.style.display = `block`
}
const damsMashup = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 dad" value="damsMashup"
    onclick="playSong(event)">
        <div class="image mashupImage rounded-2 son"></div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold text-start">Damodot Mashup</span>
            <p class="text-start whiteWrd">Damodot & Dj Great</p>
        </div>
    </button>
    <div class="songSideRgt">
        <button class="btn" id="moreOptBtn" onclick="disMoreOpt()">
            <i class="fa-solid fa-ellipsis-vertical text-white"></i>
        </button>
    </div>
</div>`
const soundCheckEp = `
<button class="btn d-flex align-items-center mt-3" onclick="dispSoundCheck()">
    <div class="image rounded-2"></div>
    <div class="artist ms-4">
        <span class="songName whiteWrd fw-bold">Soundcheck d'Ep</span>
        <p class="text-start whiteWrd">Damodot</p>
    </div>
</button>`
const onGod = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 dad" value="On God"
    onclick="playSong(event)">
        <div class="image rounded-2 son"></div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">On God</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
    <div class="songSideRgt">
        <button class="btn" id="moreOptBtn" onclick="disMoreOpt()">
            <i class="fa-solid fa-ellipsis-vertical text-white"></i>
        </button>
    </div>
</div>`
const koMaGbon = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 dadada" value="Ko Ma Gbon"
    onclick="playSong(event)">
        <div class="image myImage rounded-2">
            <img src="soundCheck.jpg" alt="" />
        </div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Ko Ma Gbon</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
    <div class="songSideRgt">
        <button class="btn" id="moreOptBtn" onclick="disMoreOpt()">
            <i class="fa-solid fa-ellipsis-vertical text-white"></i>
        </button>
    </div>
</div>`
const cumeAlong = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 dad" value="cumeAlong"
    onclick="playSong(event)">
        <div class="image rounded-2 son"></div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Cume Along</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
    <div class="songSideRgt">
        <button class="btn" id="moreOptBtn" onclick="disMoreOpt()">
            <i class="fa-solid fa-ellipsis-vertical text-white"></i>
        </button>
    </div>
</div>`
const wantingMore = ` 
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 dad" value="Wanting More"
    onclick="playSong(event)">
        <div class="image rounded-2 son"></div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Wanting More</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
    <div class="songSideRgt">
        <button class="btn" id="moreOptBtn" onclick="disMoreOpt()">
            <i class="fa-solid fa-ellipsis-vertical text-white"></i>
        </button>
    </div>
</div>`
const popEp = `
<button class="btn d-flex align-items-center mt-3" onclick="dispPop()">
    <div class="image imageTwo rounded-2"></div>
    <div class="artist ms-4">
        <span class="songName whiteWrd fw-bold">POP d'Ep</span>
        <p class="text-start whiteWrd">Damodot</p>
    </div>
</button>`
const fckedUp = ` 
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 dadUnos" value="Fcked Up"
    onclick="playSong(event)">
        <div class="image imageTwo rounded-2 sonUnos"></div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Fcked Up</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
    <div class="songSideRgt">
        <button class="btn" id="moreOptBtn" onclick="disMoreOpt()">
            <i class="fa-solid fa-ellipsis-vertical text-white"></i>
        </button>
    </div>
</div>`
const mind = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center w-75 mt-3 dadUnos" value="Mind"
    onclick="playSong(event)">
        <div class="myImage rounded-2 sonUnos">
            <img src="IMG_3189.jpg" alt="" />
        </div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Mind</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
    <div class="songSideRgt">
        <button class="btn" id="moreOptBtn" onclick="disMoreOpt()">
            <i class="fa-solid fa-ellipsis-vertical text-white"></i>
        </button>
    </div>
</div>`
const oshey = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 dadUnos" value="Oshey"
    onclick="playSong(event)">
        <div class="myImage rounded-2 sonUnos">
            <img src="IMG_3189.jpg" alt="" />
        </div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Oshey</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
    <div class="songSideRgt">
        <button class="btn" id="moreOptBtn" onclick="disMoreOpt()">
            <i class="fa-solid fa-ellipsis-vertical text-white"></i>
        </button>
    </div>
</div>`
const majo = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 dadUnos" value="Majo"
    onclick="playSong(event)">
        <div class="image myImage rounded-3 sonUnos">
            <img src="IMG_3189.jpg" alt="" />
        </div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Majo</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
    <div class="songSideRgt">
        <button class="btn" id="moreOptBtn" onclick="disMoreOpt()">
            <i class="fa-solid fa-ellipsis-vertical text-white"></i>
        </button>
    </div>
</div>`
const bootyCall = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 dadUnos" value="Booty Call"
    onclick="playSong(event)">
        <div class="image imageTwo rounded-2 sonUnos"></div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Booty Call</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
    <div class="songSideRgt">
        <button class="btn" id="moreOptBtn" onclick="disMoreOpt()">
            <i class="fa-solid fa-ellipsis-vertical text-white"></i>
        </button>
    </div>
</div>`
const bolo = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 dadUnos" value="Bolo"
    onclick="playSong(event)">
        <div class="image imageTwo rounded-2 sonUnos"></div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Bolo</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
    <div class="songSideRgt">
        <button class="btn" id="moreOptBtn" onclick="disMoreOpt()">
            <i class="fa-solid fa-ellipsis-vertical text-white"></i>
        </button>
    </div>
</div>`
const killaman = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 singer" value="Killaman"
    onclick="playSong(event)">
        <div class="myImage rounded-2">
            <img src="IMG-9415.jpg" alt="" />
        </div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Killaman</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
    <div class="songSideRgt">
        <button class="btn" id="moreOptBtn" onclick="disMoreOpt()">
            <i class="fa-solid fa-ellipsis-vertical text-white"></i>
        </button>
    </div>
</div>`
const nobody = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 singer" value="Nobody"
    onclick="playSong(event)">
        <div class="image imageFive rounded-2"></div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Nobody</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
    <div class="songSideRgt">
        <button class="btn" id="moreOptBtn" onclick="disMoreOpt()">
            <i class="fa-solid fa-ellipsis-vertical text-white"></i>
        </button>
    </div>
</div>`
const bodyBag = `
<div class="songSide d-flex align-items-center justify-content-between w-100 position-relative">
    <button class="btn d-flex align-items-center mt-3 singer" value="Body Bag"
    onclick="playSong(event)">
        <div class="image imageBodyBag rounded-2"></div>
        <div class="artist ms-4">
            <span class="songName whiteWrd fw-bold">Body Bag</span>
            <p class="text-start whiteWrd">Damodot</p>
        </div>
    </button>
    <div class="songSideRgt">
        <button class="btn" id="moreOptBtn" onclick="disMoreOpt()">
            <i class="fa-solid fa-ellipsis-vertical text-white"></i>
        </button>
    </div>
</div>`
let allSongs = [{
    dispName: "Damodot Mashup",
    name: "damsMashup",
    album: false,
    song: "damodotMashup.mp3",
    artist: "Damodot",
    button: damsMashup,
    img: "dj great +++.jpg"
},
    {
    dispName: "Soundcheck d'Ep",
    name: "soundCheckEp",
    album: true,
    song: null,
    artist: "Damodot",
    button: soundCheckEp,
    img: "soundCheck.jpg"
},
{
    dispName: "On God",
    name: "onGod",
    album: true,
    song: "onGod.mp3",
    artist: "Damodot",
    button: onGod,
    img: "soundCheck.jpg"
},
{
    dispName: "Ko Ma Gbon",
    name: "koMaGbon",
    album: true,
    song: "koMaGbon.mp3",
    artist: "Damodot",
    button: koMaGbon,
    img: "soundCheck.jpg"
},
{
    dispName: "Cume Along",
    name: "cumeAlong",
    album: true,
    song: "cumeAlong.mp3",
    artist: "Damodot",
    button: cumeAlong,
    img: "soundCheck.jpg"
},
{
    dispName: "Wanting More",
    name: "wantingMore",
    album: true,
    song: "wantingMore.mp3",
    artist: "Damodot",
    button: wantingMore,
    img: "soundCheck.jpg"
},
{
    dispName: "POP d'Ep",
    name: "popEp",
    album: true,
    song: null,
    artist: "Damodot",
    button: popEp,
    img: "IMG_3189.jpg"
},
{
    dispName: "Fcked Up",
    name: "fckedUp",
    album: true,
    song: "fckedUp.mp3",
    artist: "Damodot",
    button: fckedUp,
    img: "IMG_3189.jpg"
},
{
    dispName: "Mind",
    name: "mind",
    album: true,
    song: "Mind.mp3",
    artist: "Damodot",
    button: mind,
    img: "IMG_3189.jpg"
},
{
    dispName: "Oshey",
    name: "oshey",
    album: true,
    song: "Oshey.mp3",
    artist: "Damodot",
    button: oshey,
    img: "IMG_3189.jpg"
},
{
    dispName: "Majo",
    name: "majo",
    album: true,
    song: "Majo.mp3",
    artist: "Damodot",
    button: majo,
    img: "IMG_3189.jpg"
},
{
    dispName: "Booty Call",
    name: "bootyCall",
    album: true,
    song: "bootyCall.mp3",
    artist: "Damodot",
    button: bootyCall,
    img: "IMG_3189.jpg"
},
{
    dispName: "Bolo",
    name: "bolo",
    album: true,
    song: "bolo.mp3",
    artist: "Damodot",
    button: bolo,
    img: "IMG_3189.jpg"
},
{
    dispName: "Killaman",
    name: "killaman",
    album: false,
    song: "killaman.mp3",
    artist: "Damodot",
    button: killaman,
    img: "IMG-9415.jpg"
},
{
    dispName: "Nobody",
    name: "nobody",
    album: false,
    song: "Nobody.mp3",
    artist: "Damodot",
    button: nobody,
    img: "nobody.jpg"
},
{
    dispName: "Body Bag",
    name: "bodyBag",
    album: false,
    song: "bodyBag.mp3",
    artist: "Damodot",
    button: bodyBag,
    img: "body bag.jpg"
}
]
let arrIndex = 0
let albumsList = allSongs.filter(song => song.album === true)


function playSong(event) {
    audioPlayer.addEventListener('ended', playNextSong);

    let foundSong;
    if (event && event.currentTarget) {
        const clickedSongValue = event.currentTarget.value;
        foundSong = allSongs.find(song => song.name.toLowerCase() === clickedSongValue.toLowerCase().replace(/\s+/g, ''));
    } else {
        foundSong = allSongs[arrIndex];
    }

    if (foundSong && foundSong.song) {
        audioPlayer.src = foundSong.song;
        audioPlayer.play();
        pushNamer.textContent = foundSong.dispName;
        const downSongDp = document.getElementById('fixedPlayPics')
        downSongDp.src = foundSong.img;
        songDp.src = foundSong.img;
        let downName = document.querySelector('.downSongName')
        downName.textContent = foundSong.dispName;
        playButton.forEach(btn => {
            btn.innerHTML = `<i class="fa-solid fa-pause text-white"></i>`;
        });
        player.style.transform = `translateY(0)`
        player.style.transition = 'all 0.3s ease'
    } else {
        alert('Song not found or no audio file specified');
    }
}
if (player.style.transform === "translateY(0)") {
    fixedSongInfo.style.display = "none"
}

const firebaseConfig = {
    apiKey: "AIzaSyCFl9LtA75ZlOPUxsAIpgaJRRKhPZAhVGY",
    authDomain: "hitvverse.firebaseapp.com",
    projectId: "hitvverse",
    storageBucket: "hitvverse.firebasestorage.app",
    messagingSenderId: "151581483016",
    appId: "1:151581483016:web:3fa4a135104d6d621731bd"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

function welcUser() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            let welcomeMessage = document.querySelector(".fadeCont")
            welcomeMessage.innerHTML = `<h2 class="anton-sc-regular mt-2">HELLO ${user.displayName}</h2>
                                <h3 class="anton-sc-regular">WELCOME TO HITVERSE</h3>
                                <h4 class="anton-sc-regular">YOU'RE AN OFFICIAL DISTURBER</h4>`
            user.reload().then(() => {
                console.log("User object after reload:", user)
            }).catch((error) => {
                console.error("Error reloading user profile:", error.message)
            });
            var uid = user.uid

        } else {
            alert("You must be signed in to access this page");
            window.location.href = "signUp.html";
        }
    });
}

welcUser()

allMusic.forEach((element) => {
    element.addEventListener('click', () => {
        player.style.display = 'block'
    })
})
allMusicTwo.forEach((element) => {
    element.addEventListener('click', () => {
        player.style.display = 'block'
    })
})
allMusicThree.forEach((element) => {
    element.addEventListener('click', () => {
        player.style.display = 'block'
    })
})


myFirstView.style.display = 'flex'

setTimeout(() => {
    myFirstView.style.display = 'none'
}, 3000);

function songList() {
    if (myDisplay.style.display === '' || myDisplay.style.display === `block`) {
        myDisplay.style.display = `none`
        songListed.style.display = `block`
        const topSongName = document.getElementById('topSongNamer')
        const topAlbumName = document.getElementById('topAlbumNamer')
        topSongName.textContent = "Songs"
        topAlbumName.textContent = "Latest Tracks"
        const fullSongs = document.querySelector('.realList')
        fullSongs.innerHTML = ``
        for (let index = 0; index < allSongs.length; index++) {
            fullSongs.innerHTML += allSongs[index].button
        }
    } else {
        myDisplay.style.display = `block`
        welcUser()
    }
}
function albumList() {
    if (myDisplay.style.display === '' || myDisplay.style.display === `block`) {
        myDisplay.style.display = `none`
        songListed.style.display = `block`
        const fullSongs = document.querySelector('.realList')
        const topSongName = document.getElementById('topSongNamer')
        const topAlbumName = document.getElementById('topAlbumNamer')
        topSongName.textContent = "Albums"
        topAlbumName.textContent = "Latest Album"
        fullSongs.innerHTML = ``
        for (let index = 0; index < allSongs.length; index++) {
            if (allSongs[index].album === true) {
                fullSongs.innerHTML += allSongs[index].button
            }
        }
    } else {
        myDisplay.style.display = `block`
        welcUser()
    }
}
function lyricsShow() {
    if (myDisplay.style.display === '' || myDisplay.style.display === `block`) {
        myDisplay.style.display = `none`
        songListed.style.display = `block`
        const fullSongs = document.querySelector('.realList')
        const topSongName = document.getElementById('topSongNamer')
        const topAlbumName = document.getElementById('topAlbumNamer')
        topSongName.textContent = "Lyrics"
        topAlbumName.textContent = "All Lyrics"
        fullSongs.innerHTML = ``
        for (let index = 0; index < allLyricsBtn.length; index++) {
            fullSongs.innerHTML += allLyricsBtn[index]
        }
    } else {
        myDisplay.style.display = `block`
        welcUser()
    }
}


function isLiked(songName) {
    return likedSongs.some(song => song.name.toLowerCase() === songName.toLowerCase());
}

function updateLikeButtonColor() {
    const currentSongName = pushNamer.textContent;
    const likeButton = document.querySelector('.likeButtonWhite');

    const currentSong = allSongs.find(song =>
        song.dispName.toLowerCase() === currentSongName.toLowerCase()
    );

    if (likeButton && currentSong) {
        const isLiked = likedSongs.some(song =>
            song.dispName === currentSong.dispName
        );
        likeButton.style.color = isLiked ? 'red' : 'white';
    }
}

audioPlayer.addEventListener('loadeddata', updateLikeButtonColor);
function likeSong() {

    const findCurrentSong = () => {
        const currentSongName = pushNamer.textContent;
        return allSongs.find(song => song.dispName.toLowerCase() === currentSongName.toLowerCase());
    };
    console.log('Current song:', findCurrentSong());
    console.log(likedSongs);

    if (findCurrentSong()) {
        const currentSong = findCurrentSong();
        const likeButton = document.querySelector('.likeButtonWhite');
        if (findCurrentSong()) {
            const currentSong = findCurrentSong();
            if (!likedSongs.includes(currentSong)) {
                likedSongs.push(currentSong);
                likeButton.style.color = 'red';
                console.log('Song added to liked songs:', likedSongs);
            } else {
                likedSongs = likedSongs.filter(song => song !== currentSong);
                likeButton.style.color = 'white';
                console.log('Song removed from liked songs:', likedSongs);
            }
        }
    }
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
}
function likedSongsList() {
    if (myDisplay.style.display === '' || myDisplay.style.display === `block`) {
        myDisplay.style.display = `none`
        songListed.style.display = `block`
        const fullSongs = document.querySelector('.realList')
        const topSongName = document.getElementById('topSongNamer')
        const topAlbumName = document.getElementById('topAlbumNamer')
        topSongName.textContent = "Favourites"
        topAlbumName.textContent = "Liked Songs"
        fullSongs.innerHTML = ``
        if (likedSongs.length === 0) {
            fullSongs.innerHTML = `<h3 class="text-white text-center mt-4">You've not liked any songs yet</h3>`;
        } else {
            for (let song of likedSongs) {
                fullSongs.innerHTML += song.button;
            }
        }
    } else {
        myDisplay.style.display = `block`
        welcUser()
    }
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
}
function showSongList() {
    if (songListed.style.display === `block`) {
        songListed.style.display = `none`
        myDisplay.style.display = `block`
    } else {
        songListed.style.display = `block`
    }
}
function dispSoundCheck() {
    if (soundList.style.display === `block`) {
        soundList.style.display = `none`
    } else {
        soundList.style.display = `block`
    }
}
function dispPop() {
    if (popList.style.display === `block`) {
        popList.style.display = `none`
    } else {
        popList.style.display = `block`
    }
}
function remPlayer() {
    player.style.transform = `translateY(100%)`
    player.style.transition = 'all 0.3s ease'
}
playButton.forEach((playerButton) => {
    playerButton.addEventListener("click", () => {
        if (!audioPlayer.src || audioPlayer.src.endsWith('/')) {
            alert('No song on deck');
            console.log('Current src value:', audioPlayer.src);
            return;
        }
        if (audioPlayer.paused) {
            audioPlayer.play()
            playButton.forEach(btn => {
                btn.innerHTML = `<i class="fa-solid fa-pause text-white"></i>`
            })
            console.log("Resumed");
        } else {
            audioPlayer.pause()
            playButton.forEach(btn => {
                btn.innerHTML = `<i class="fa-solid fa-play text-white"></i>`
            })
            console.log("Paused");
        }
    })
})
function displayPlayer() {
    if (!audioPlayer.src || audioPlayer.src.endsWith('/')) {
        alert('No song on deck');
        console.log('Current src value:', audioPlayer.src);
        return;
    }
    player.style.transform = `translateY(0)`
    player.style.transition = 'all 0.3s ease'
}
function disMoreOpt() {
    console.log("hello");
    let moreOption = document.querySelector('.dropCont')
    let moreOptBtn = document.querySelector('#moreOptBtn')

    console.log("Window width:", window.innerWidth);
    console.log("moreOption found:", moreOption);
    if (window.innerWidth <= 768) {
        moreOption.style.top = `10%`
        console.log("Setting top to 10%");

    } else {
        moreOption.style.top = `50%`
        console.log("Setting top to 50%");
    }
    moreOptBtn.disabled = true
    moreOption.style.transition = 'all 0.3s ease'
}
window.addEventListener('resize', disMoreOpt)

audioPlayer.addEventListener('timeupdate', () => {
    let current = audioPlayer.currentTime
    let duration = audioPlayer.duration
    waiter.value = (current / duration) * 100
    currentTime.textContent = formatTime(current)
})

waiter.addEventListener('input', () => {
    let duration = audioPlayer.duration
    audioPlayer.currentTime = (waiter.value / 100) * duration
})

audioPlayer.addEventListener('loadedmetadata', () => {
    totalTime.textContent = formatTime(audioPlayer.duration)
})

function formatTime(seconds) {
    let minutes = Math.floor(seconds / 60)
    let secs = Math.floor(seconds % 60)
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`
}

function cancDropCont() {
    console.log("hello");
    let moreOption = document.querySelector('.dropCont')
    moreOption.style.top = `100%`
    moreOption.style.transition = 'all 0.3s ease'
    let moreOptBtn = document.querySelectorAll('#moreOptBtn')
    moreOptBtn.forEach(btn => {
        btn.disabled = false
    })
}


let allLists = [allSongs, albumsList, likedSongs]

function playNextSong() {
    let currentList = allSongs;

    // Determine which list we're currently using
    const currentSongName = pushNamer.textContent;
    const currentSong = allSongs.find(song => song.dispName === currentSongName);

    // If we're viewing albums
    if (songListed.style.display === 'block' && document.getElementById('topSongNamer').textContent === 'Albums') {
        currentList = albumsList.filter(song => song.song !== null);
    }
    // If we're viewing liked songs
    else if (songListed.style.display === 'block' && document.getElementById('topSongNamer').textContent === 'Favourites') {
        currentList = likedSongs.filter(song => song.song !== null);
    }
    // Default to all songs
    else {
        currentList = allSongs.filter(song => song.song !== null);
    }

    // Find current song index in the current list
    let currentIndex = currentList.findIndex(song => song.dispName === currentSongName);

    // Get next index, loop back to 0 if at end
    let nextIndex = (currentIndex + 1) % currentList.length;

    // Update global array index to match the song we're about to play
    arrIndex = allSongs.findIndex(song => song.dispName === currentList[nextIndex].dispName);

    playSong();
    displayLyrics()
}

function playPrevSong() {
    let currentList = allSongs;

    const currentSongName = pushNamer.textContent;
    const currentSong = allSongs.find(song => song.dispName === currentSongName);

    if (songListed.style.display === 'block' && document.getElementById('topSongNamer').textContent === 'Albums') {
        currentList = albumsList.filter(song => song.song !== null);
    } else if (songListed.style.display === 'block' && document.getElementById('topSongNamer').textContent === 'Favourites') {
        currentList = likedSongs.filter(song => song.song !== null);
    } else {
        currentList = allSongs.filter(song => song.song !== null);
    }

    let currentIndex = currentList.findIndex(song => song.dispName === currentSongName);

    let prevIndex = currentIndex <= 0 ? currentList.length - 1 : currentIndex - 1;

    arrIndex = allSongs.findIndex(song => song.dispName === currentList[prevIndex].dispName);

    playSong();
    displayLyrics()
}

function displayLyrics() {
    if (pushNamer.textContent === `...`) {
        alert('No song on deck')
        return
    }
    const songTitle = pushNamer.textContent;
    const lyricsShow = document.querySelector('.lyricsCont');

    if (window.innerWidth <= 768) {
        player.style.transform = `translateY(100%)`
        player.style.transition = 'all 0.3s ease'

    }
    // Map song titles to their lyrics variables
    const lyricsMap = {
        'On God': lyricsOnGod,
        'Ko Ma Gbon': lyricsKoMaGbon,
        'Cume Along': lyricsCumeAlong,
        'Wanting More': lyricsWantingMore,
        'Fcked Up': lyricsFckedUp,
        'Mind': lyricsMind,
        'Oshey': lyricsOshey,
        'Majo': lyricsMajo,
        'Booty Call': lyricsBootyCall,
        'Bolo': lyricsBolo,
        'Killaman': lyricsKillaman,
        'Nobody': lyricsNobody,
        'Body Bag': lyricsBodyBag
        // Add more mappings as needed for other songs
    };

    // Get the lyrics for the clicked song
    const lyrics = lyricsMap[songTitle];
    if (lyrics) {
        lyricsShow.innerHTML = lyrics;
    } else {
        lyricsShow.innerHTML = '<h6 class="whiteShad text-center text-white">Lyrics not available</h6>';
    }
    const lyricsDisplay = document.querySelector('.lyricsDisplay')
    songListed.style.display = `none`
    lyricsDisplay.style.display = `block`
    lyricsDisplay.style.transition = 'display 0.3s ease'
}

function musicQueue() {
    player.style.transform = `translateY(100%)`
    player.style.transition = 'all 0.3s ease'
}
console.log("Hello")
