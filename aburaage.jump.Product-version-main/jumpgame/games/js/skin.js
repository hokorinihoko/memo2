window.onload = () => {
  const current = localStorage.getItem("selectedSkin");
  document.getElementById("currentSkin").textContent = current;

  document.getElementById("select1").onclick = () => {
    localStorage.setItem("selectedSkin", "Acommon1");
    document.getElementById("currentSkin").textContent = "Acommon1";
  };

  document.getElementById("back").onclick = () => location.href = "index.html";
};
