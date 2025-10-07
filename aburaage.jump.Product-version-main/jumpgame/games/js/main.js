// GPの初期値
if (!localStorage.getItem("gp")) localStorage.setItem("gp", "25");
if (!localStorage.getItem("selectedSkin")) localStorage.setItem("selectedSkin", "Acommon1");

// 現在のGPを表示する関数
function showGP() {
  const gpElem = document.getElementById("gp");
  if (gpElem) gpElem.textContent = localStorage.getItem("gp");
}

// GP変更用関数
function addGP(amount) {
  let gp = parseInt(localStorage.getItem("gp"));
  gp += amount;
  localStorage.setItem("gp", gp);
  showGP();
}
