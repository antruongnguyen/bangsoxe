<script>
	import { toPng } from "html-to-image";
	import download from "downloadjs";

	const locales = {
	  en: {
	    title: "Vietnamese Vehicle Plate Number",
	    language: "Language",
	    vehicle: "Vehicle",
	    motobike: "Motobike",
	    auto: "Auto",
	    generate: "Generate",
	    download: "Download",
	    footNote: "* This generator is for testing purpose only."
	  },
	  vi: {
	    title: "Bảng số xe Việt Nam",
	    language: "Ngôn ngữ",
	    vehicle: "Phương tiện",
	    motobike: "Mô tô & xe máy",
	    auto: "Ô tô",
	    generate: "Tạo ngẫu nhiên",
	    download: "Tải về",
	    footNote: "* Tạo bảng số xe ngẫu nhiên cho mục đích kiểm thử."
	  }
	};

	let vehicle = "motobike";
	let language = "vi";
	let locale = locales[language];
	let plateNumberElement;

	const hcmNo = [50, 51, 52, 53, 54, 55, 56, 57, 58, 59];
	const alphabet = "ABCDEFGHIJKLMNPQRSTUVWXYZ";

	function randomNumber(min = 0, max = 9) {
	  return Math.floor(Math.random() * (max - min)) + min;
	}

	let line1 = "";
	let line2 = "";

	function randomPlateNumber() {
	  const regionNo = hcmNo[randomNumber(0, hcmNo.length)];
	  const randomletter = alphabet[randomNumber(0, alphabet.length)];
	  line1 = `${regionNo}-${randomletter}${randomNumber()}`;
	  if (vehicle === "auto") {
	    line1 = `${regionNo}${randomletter}`;
	  }
	  line2 = `${randomNumber()}${randomNumber()}${randomNumber()}.${randomNumber()}${randomNumber()}`;
	  return `${line1} ${line2}`;
	}

	let plateNumber = randomPlateNumber();

	function doGenerate() {
	  plateNumber = randomPlateNumber();
	}

	function doDownload() {
	  if (plateNumberElement) {
	    toPng(plateNumberElement).then(function(dataUrl) {
	      download(dataUrl, `${plateNumber}.png`);
	    });
	  }
	}

	function doChangeLanguage() {
	  locale = locales[language];
	}
</script>

<style>
		@import url("https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600&display=swap");

		main {
		  font-family: "Exo 2", sans-serif;
		  text-align: center;
		}

		.mt-1 {
		  margin-top: 1rem;
		}

		p {
		  margin: 0px;
		}

		button {
		  background: #ff3e00;
		  color: white;
		  border: none;
		  padding: 8px 12px;
		  border-radius: 2px;
		}

		.frame {
		  padding: 0 5px;
		  border: 6px solid #000;
		  border-radius: 5px;
		  width: 300px;
		  height: 221px;
		  background-color: #fff;
		}

		.plate-container {
		  font-weight: 600;
		  font-size: 5.5em;
		  width: fit-content;
		  margin-left: auto;
		  margin-right: auto;
		  padding: 1rem;
		}
</style>

<main>
	<h1>{locale.title}</h1>
  
  <div align="center">
    <label for="">
      <b>{locale.language}</b>
    </label>

    <label for="language-vi">
      <input id="language-vi" type="radio" value="vi" bind:group={language} on:change={doChangeLanguage}>
      Tiếng Việt
    </label>

    <label for="language-en">
      <input id="language-en" type="radio" value="en" bind:group={language} on:change={doChangeLanguage}>
      English
    </label>
  </div>

  <div align="center" class="mt-1">
    <label for="">
      <b>{locale.vehicle}</b>
    </label>

    <label for="vehicle-motobike">
      <input id="vehicle-motobike" type="radio" value="motobike" bind:group={vehicle} on:change={doGenerate}>
      {locale.motobike}
    </label>

    <label for="vehicle-auto">
      <input id="vehicle-auto" type="radio" value="auto" bind:group={vehicle} on:change={doGenerate}>
      {locale.auto}
    </label>
  </div>

  <div bind:this={plateNumberElement} class="plate-container mt-1">
    <div class="frame">
      <p>{line1}<br>{line2}</p>
    </div>
  </div>

  <p align="center" class="mt-1">
    <button on:click={doGenerate}>
      {locale.generate}
    </button>
    <button on:click={doDownload}>
      {locale.download}
    </button>
  </p>

  <p class="mt-1">{locale.footNote}</p>
</main>