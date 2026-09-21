(() => {
  const BASE='https://6aaffdf7e77affbcec9b2854--behrooz-tajik-portfolio.netlify.app';
  const photo=(folder,file)=>`${BASE}/assets/photos_web/${folder}/${file}.jpg`;
  const film=(n,file)=>({
    poster:`${BASE}/assets/film/posters/${String(n).padStart(2,'0')}_${file}.jpg`,
    video:`${BASE}/assets/film/videos/${String(n).padStart(2,'0')}_${file}.mp4`,
    label:`Video ${String(n).padStart(2,'0')}`
  });
  const project=(title,media,kind='photo')=>({title,kind,cover:media[0]?.src||media[0]?.poster||'',media});
  const photos=(folder,files)=>files.map((f,i)=>({src:photo(folder,f),label:`Photo ${String(i+1).padStart(2,'0')}`}));
  const externalPhotos=(items)=>items.map((x,i)=>({src:photo(x.folder,x.file),label:`Photo ${String(i+1).padStart(2,'0')}`}));

  const fashion=[
    project('Fashion 01',photos('fashion',['08','09','10','11'])),
    project('Fashion 02',photos('fashion',['12','13','14'])),
    project('Fashion 03',photos('fashion',['15','16','17'])),
    project('Fashion 04',photos('fashion',['18','19'])),
    project('Fashion 05',photos('fashion',['24','25'])),
    project('Fashion 06',photos('fashion',['26','27'])),
    project('Fashion 07',photos('fashion',['28'])),
    project('Fashion 08',photos('fashion',['36','39','40'])),
    project('Fashion 09',photos('fashion',['41','42','43','44','45','48'])),
    project('Fashion 10',photos('fashion',['50','53','59','60'])),
    project('Fashion 11',externalPhotos([
      {folder:'sports',file:'20'},{folder:'sports',file:'21'},{folder:'sports',file:'22'},{folder:'sports',file:'23'}
    ]))
  ];

  const sports=[
    project('Sports 01',photos('sports',['37','38','51','52','54','56','57','58','61'])),
    project('Sports 02',photos('sports',['55']))
  ];

  const commercial=[
    project('Commercial 01',photos('commercial',['01'])),
    project('Commercial 02',photos('commercial',['02','03','07'])),
    project('Commercial 03',photos('commercial',['04','06'])),
    project('Commercial 04',photos('commercial',['05'])),
    project('Commercial 05',photos('commercial',['29','30','31','32','33','34','35','46'])),
    project('Commercial 06',photos('commercial',['47','49']))
  ];

  const f=[
    film(1,'Film_IMG_5629'),
    film(2,'Film_IMG_5650'),
    film(3,'Film_IMG_6246'),
    film(4,'Film_IMG_9057'),
    film(5,'Film_IMG_9537'),
    film(6,'Film_Ya-habibi-Cafe-editv2-Linked-Comp-01_2'),
    film(7,'Film_copy_91AC4417-C20F-4E39-961B-87DF126EBE94'),
    film(8,'Film_copy_9A3CDA31-CFED-4D39-A817-2DF05F2D5D56'),
    film(9,'Film_copy_CC4EEBBE-4255-4DCB-A54D-6FFA276387E5'),
    film(10,'Film_copy_E3E607B9-ECCD-4A7B-B6E6-141E3D6CD433'),
    film(11,'Film_lv_0_20250224181659'),
    film(12,'Film_lv_0_20250224190706'),
    film(13,'Film_lv_0_20250224192020'),
    film(14,'Film_lv_0_20250224195106'),
    film(15,'Film_seedance-watermark-removed'),
    film(16,'Film_watermark-removed-gemini_generated_video_419720E1'),
    film(17,'Film_watermark-removed-gemini_generated_video_432D497A'),
    film(18,'Film_watermark-removed-gemini_generated_video_97D30F58'),
    film(19,'Film_watermark_removed_39bc8d8a-2c68-416d-b66e-a29d85b1'),
    film(20,'Film2_2943609360502256365'),
    film(21,'Film2_3434142392481549537'),
    film(22,'Film2_2292687975763488520'),
    film(23,'Film2_3049858548819249091'),
    film(24,'Film2_334840581930979221'),
    film(25,'Film2_356908363250399295'),
    film(26,'Film3_4212385212205351283'),
    film(27,'Film3_4299026816250816050'),
    film(28,'Film3_4445799585677503765'),
    film(29,'Film3_5217455430981304806'),
    film(30,'Film3_5812670982451048663'),
    film(31,'Film3_6403326009543911887'),
    film(32,'Film4_6892076444913757810'),
    film(33,'Film4_IMG_4712'),
    film(34,'Film4_IMG_5035'),
    film(35,'Film4_IMG_5594'),
    film(36,'Film4_IMG_5616'),
    film(37,'Film4_IMG_6133'),
    film(38,'Film4_lv_0_20250203161424'),
    film(39,'New4_Camera_emerges_from_teal_glass_20260919175031'),
    film(40,'New4_Camera_tracking_Versace_Eros_bottle_20260919174004'),
    film(41,'New4_Create_product_ad_video_20260917121129'),
    film(42,'New4_Create_product_ad_video_walkthrough_20260918163640'),
    film(43,'New4_Drone_filming_product_ad_video_20260918163828')
  ];
  const filmProjects=[
    project('Film 01',f.slice(0,5),'video'),
    project('Film 02',f.slice(5,6),'video'),
    project('Film 03',f.slice(6,10),'video'),
    project('Film 04',f.slice(10,14),'video'),
    project('Film 05',f.slice(14,15),'video'),
    project('Film 06',f.slice(15,19),'video'),
    project('Film 07',f.slice(19,25),'video'),
    project('Film 08',f.slice(25,31),'video'),
    project('Film 09',f.slice(31,38),'video'),
    project('Film 10',f.slice(38,43),'video')
  ];

  window.PORTFOLIO_DATA={
    assetBase:BASE,
    fashion:{title:'Fashion',subtitle:'Fashion · Portrait',projects:fashion,total:34},
    sports:{title:'Sports',subtitle:'Football · Rowing · Athletes',projects:sports,total:10},
    commercial:{title:'Commercial',subtitle:'Food & Beverage · Product · Brands · Objects',projects:commercial,total:17},
    film:{title:'Film',subtitle:'All video work',projects:filmProjects,total:43}
  };
  // Media still awaiting extraction into the final deploy bundle: Ax 2.zip + New2.zip.
})();