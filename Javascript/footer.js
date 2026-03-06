var footerElement = document.getElementById("footer")
fetch("footer.html")
    .then((response) => response.text())
    .then((html) => {
        footerElement.innerHTML = html;
    });