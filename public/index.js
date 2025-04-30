import Letterize from "https://cdn.skypack.dev/letterizejs@2.0.0";

let themeToggle = document.getElementById('themeToggle')
let body = document.body
let mainHeaderImg = document.getElementById('topImg')
let chihiro = document.querySelector('.textChange')
let chihiroZero = document.querySelector('.damoText')
let chihiroOne = document.querySelector('.undLabeler')
// let chihiroTwo = document.querySelector('.undLabel1')
// let chihiroThree = document.querySelector('.undLabel2')
let loudVol = document.querySelector('.volumeText')
let listenBtn = document.querySelector('.listenBtn')
let iconBtn = document.querySelector('.myBtn')
let dIcons = document.querySelector('.sideIcons')
let wordAround = document.querySelectorAll(".animate-me")
let allSideBtn = document.querySelectorAll('.acod')

console.log(allSideBtn);

iconBtn.addEventListener('click', () => {
    dIcons.classList.toggle('view')
})

themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
        loudVol.style.color = `white`
        allSideBtn.forEach(btn => {
            btn.style.color = `white`
        })
        wordAround.forEach(animate => {
            animate.style.color = `white`
        })
        body.style.backgroundColor = `black`
        chihiro.style.color = `black`
        chihiroZero.style.color = `white`
        chihiroOne.style.color = `white`
        // chihiroTwo.style.color = `white`
        // chihiroThree.style.color = `white`
        listenBtn.style.color = `white`
        listenBtn.style.borderColor = `white`
        mainHeaderImg.src = "./pexels-mark-angelo-sampan-738078-1587927.jpg"
    } else {
        loudVol.style.color = `white`
        allSideBtn.forEach(btn => {
            btn.style.color = `black`
        })
        wordAround.forEach(animate => {
            animate.style.color = `black`
        })
        body.style.backgroundColor = `white`
        chihiro.style.color = `white`
        chihiroZero.style.color = `black`
        chihiroOne.style.color = `black`
        // chihiroTwo.style.color = `black`
        // chihiroThree.style.color = `black`
        listenBtn.style.color = `white`
        listenBtn.style.borderColor = `white`
        mainHeaderImg.src = "./pexels-mark-angelo-sampan-738078-1587927.jpg"
    }
    console.log("Hello");

})

let test = new Letterize({
    targets: ".animate-me"
});

let animation = anime.timeline({
    targets: test.listAll,
    delay: anime.stagger(100, {
        grid: [test.list[0].length, test.list.length],
        from: "center"
    }),
    loop: true
});

animation
    .add({ scale: 0.7 })
    .add({ letterSpacing: "0.25em" })
    .add({ scale: 1 })
    .add({ letterSpacing: "0.2em" });

