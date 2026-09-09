// Bulk-pings IndexNow for all 450 leadgennearyou.com city pages
// IndexNow tells Bing/Yandex/Naver to crawl new URLs instantly
// Usage: POST /functions/LeadGenIndexNow { "host": "leadgennearyou.com" }
// The IndexNow key file is at /leadgennearme2026idx.txt (in public/)

const INDEXNOW_KEY = "leadgennearme2026idx";

const RAW_ROUTES = [
  "/ca/los-angeles-commerce","/ca/san-diego","/ct/bridgeport","/ct/greenwich","/ct/norwalk","/ct/stamford",
  "/dc/washington","/de/wilmington","/fl/alafaya","/fl/altamonte-springs","/fl/apopka","/fl/atlantic-beach",
  "/fl/bellview","/fl/biscayne-gardens","/fl/boca-raton","/fl/bradenton","/fl/brooksville","/fl/cape-coral",
  "/fl/cape-coral-fl","/fl/casselberry","/fl/clearwater","/fl/coconut-creek","/fl/conway","/fl/cooper-city",
  "/fl/coral-gables","/fl/coral-springs","/fl/crestview","/fl/cypress-lake","/fl/davie","/fl/daytona-beach",
  "/fl/deerfield-beach","/fl/delray-beach","/fl/deltona","/fl/destin","/fl/doctor-phillips","/fl/doral",
  "/fl/dunedin","/fl/eatonville","/fl/edgewater","/fl/egypt-lake-leto","/fl/englewood","/fl/eustis",
  "/fl/fernandina-beach","/fl/florida-city","/fl/florida-ridge","/fl/fort-lauderdale","/fl/fort-lauderdale-fl",
  "/fl/fort-myers","/fl/fort-pierce","/fl/fort-walton-beach","/fl/fountainbleau","/fl/fountainebleau",
  "/fl/four-corners","/fl/fruit-cove","/fl/gainesville","/fl/goldenrod","/fl/gulf-breeze","/fl/haines-city",
  "/fl/hialeah","/fl/hialeah-fl","/fl/holiday","/fl/holly-hill","/fl/hollywood","/fl/homestead",
  "/fl/horizon-west","/fl/hudson","/fl/iona","/fl/jacksonville","/fl/jacksonville-beach","/fl/jacksonville-fl",
  "/fl/kendale-lakes","/fl/kendall","/fl/kendall-west","/fl/kissimmee","/fl/lady-lake","/fl/lake-magdalene",
  "/fl/lakeland","/fl/largo","/fl/lauderdale-lakes","/fl/lauderhill","/fl/lealman","/fl/leesburg",
  "/fl/leisure-city","/fl/lockhart","/fl/longwood","/fl/lutz","/fl/maitland","/fl/mango","/fl/margate",
  "/fl/melbourne","/fl/miami","/fl/miami-fl","/fl/miami-gardens","/fl/milton","/fl/miramar","/fl/naples",
  "/fl/new-port-richey","/fl/new-smyrna-beach","/fl/niceville","/fl/nocatee","/fl/north-lauderdale",
  "/fl/north-miami","/fl/north-miami-beach","/fl/north-palm-beach","/fl/north-port","/fl/oakland-park",
  "/fl/ocala","/fl/ocoee","/fl/oldsmar","/fl/orlando","/fl/orlando-altamonte-springs","/fl/orlando-fl",
  "/fl/orlando-winter-garden","/fl/ormond-beach","/fl/oviedo","/fl/palatka","/fl/palm-bay","/fl/palm-beach",
  "/fl/palm-city","/fl/palm-harbor","/fl/palm-river-clair-mel","/fl/palm-springs","/fl/palmetto",
  "/fl/panama-city","/fl/parkland","/fl/pembroke-pines","/fl/pensacola","/fl/pinellas-park","/fl/plant-city",
  "/fl/plantation","/fl/poinciana","/fl/pompano-beach","/fl/port-charlotte","/fl/port-orange",
  "/fl/port-st-lucie","/fl/port-st-lucie-fl","/fl/punta-gorda","/fl/richmond-west","/fl/riverview",
  "/fl/saint-augustine","/fl/sanford","/fl/sarasota","/fl/sarasota-springs","/fl/sebastian","/fl/seminole",
  "/fl/south-daytona","/fl/south-miami-heights","/fl/spring-hill","/fl/st-cloud","/fl/st-petersburg",
  "/fl/st-petersburg-fl","/fl/stuart","/fl/sunrise","/fl/sweetwater","/fl/tallahassee-fl","/fl/tamarac",
  "/fl/tamiami","/fl/tampa","/fl/tampa-fl","/fl/tarpon-springs","/fl/temple-terrace","/fl/the-hammocks",
  "/fl/town-n-country","/fl/venice","/fl/vero-beach","/fl/vero-beach-south","/fl/villas","/fl/wesley-chapel",
  "/fl/west-little-river","/fl/west-palm-beach","/fl/west-pensacola","/fl/westchester","/fl/weston",
  "/fl/winter-garden","/fl/winter-haven","/fl/winter-park","/fl/winter-springs","/fl/wright","/fl/zephyrhills",
  "/ga/alpharetta","/ga/atlanta","/ga/atlanta-marietta","/ga/clayton","/ga/conyers","/ga/decatur",
  "/ga/kennesaw","/ga/lawrenceville","/ga/marietta","/ga/pooler","/ga/rome","/ga/roswell","/ga/sandy-springs",
  "/ga/savannah","/ga/smyrna","/ga/snellville","/ga/stone-mountain","/ga/tucker","/ga/woodstock",
  "/ia/cedar-rapids","/ia/davenport","/il/aurora","/il/champaign","/il/elgin","/il/joliet","/il/naperville",
  "/il/peoria","/il/rockford","/in/evansville","/in/fort-wayne","/in/south-bend","/ky/broken-arrow-ok",
  "/ky/chattanooga-tn","/ky/edmond-ok","/ky/knoxville-tn","/ky/lawton-ok","/ky/lexington-ky","/ky/louisville",
  "/ky/louisville-ky","/ky/memphis-tn","/ky/norman-ok","/ky/stillwater-ok","/md/bethesda","/md/bethesda-maryland",
  "/md/bowie","/md/brentwood","/md/college-park","/md/dover-delaware","/md/erie-pennsylvania",
  "/md/frederick-maryland","/md/gaithersburg","/md/gaithersburg-maryland","/md/hyattsville",
  "/md/levittown-pennsylvania","/md/rockville","/md/rockville-maryland","/md/scranton-pennsylvania",
  "/md/silver-spring","/md/silver-spring-maryland","/md/wilmington-delaware","/mi/ann-arbor","/mi/bloomfield",
  "/mi/clinton-township","/mi/dearborn","/mi/detroit","/mi/lansing","/mi/sterling-heights","/mi/warren",
  "/nc/cary","/nc/chapel-hill","/nc/charlotte","/nc/concord","/nc/durham","/nc/garner","/nc/gastonia",
  "/nc/huntersville","/nc/kannapolis","/nc/raleigh","/nc/wake-forest","/nj/camden","/nj/cherry-hill",
  "/nj/clifton","/nj/garfield","/nj/hackensack","/nj/jersey-city","/nj/little-falls","/nj/newark",
  "/nj/paramus","/nj/passaic","/nj/paterson","/nj/trenton","/nm/albuquerque","/ny/albany-new-york",
  "/ny/brentwood","/ny/buffalo-new-york","/ny/camden-new-jersey","/ny/cherry-hill-new-jersey",
  "/ny/edison-new-jersey","/ny/freeport","/ny/hempstead","/ny/herkimer","/ny/huntington","/ny/levittown",
  "/ny/long-beach","/ny/long-island","/ny/marcy","/ny/new-hartford","/ny/new-rochelle","/ny/new-york",
  "/ny/oneida","/ny/paramus-new-jersey","/ny/richmond-hill","/ny/rochester-new-york","/ny/rome",
  "/ny/syracuse-new-york","/ny/trenton-new-jersey","/ny/utica","/ny/valley-stream","/ny/white-plains",
  "/ny/woodbridge-new-jersey","/ny/yonkers","/oh/akron","/oh/cincinnati","/oh/cleveland","/oh/columbus",
  "/oh/dayton","/oh/toledo","/ok/bethany","/ok/choctaw","/ok/del-city","/ok/edmond","/ok/midwest-city",
  "/ok/oklahoma-city","/ok/warr-acres","/pa/allentown","/pa/bethlehem","/pa/greater-philadelphia",
  "/pa/hazleton","/pa/king-of-prussia","/pa/lebanon","/pa/norristown","/pa/philadelphia","/pa/pottsville",
  "/pa/reading","/sc/anderson","/sc/charleston","/sc/easley","/sc/goose-creek","/sc/greenville","/sc/greer",
  "/sc/hilton-head-island","/sc/mount-pleasant","/sc/north-charleston","/sc/rock-hill","/sc/simpsonville",
  "/sc/spartanburg","/sc/summerville","/tn/chattanooga","/tn/nashville","/tx/abilene","/tx/allen",
  "/tx/amarillo","/tx/arlington","/tx/atascocita","/tx/austin","/tx/baytown","/tx/beaumont","/tx/bedford",
  "/tx/burleson","/tx/carrollton","/tx/cedar-park","/tx/channelview","/tx/college-station","/tx/colleyville",
  "/tx/conroe","/tx/coppell","/tx/dallas","/tx/desoto","/tx/duncanville","/tx/edinburg","/tx/el-paso",
  "/tx/euless","/tx/farmers-branch","/tx/flower-mound","/tx/fort-worth","/tx/friendswood","/tx/frisco",
  "/tx/garland","/tx/georgetown","/tx/grand-prairie","/tx/grapevine","/tx/haltom-city","/tx/harlingen",
  "/tx/houston","/tx/hurst","/tx/irving","/tx/keller","/tx/kyle","/tx/la-porte","/tx/lancaster",
  "/tx/league-city","/tx/lewisville","/tx/little-elm","/tx/lubbock","/tx/mansfield","/tx/mcallen",
  "/tx/mckinney","/tx/mesquite","/tx/mission","/tx/mission-bend","/tx/missouri-city","/tx/new-braunfels",
  "/tx/north-richland-hills","/tx/pasadena","/tx/pearland","/tx/pflugerville","/tx/pharr","/tx/plano",
  "/tx/richardson","/tx/richland-hills","/tx/rockwall","/tx/rosenberg","/tx/round-rock","/tx/rowlett",
  "/tx/san-antonio","/tx/san-marcos","/tx/schertz","/tx/socorro","/tx/south-houston","/tx/southlake",
  "/tx/sugar-land","/tx/the-colony","/tx/timberwood-park","/tx/watauga","/tx/weslaco","/tx/wichita-falls",
  "/va/alexandria","/va/alexandria-va","/va/arlington","/va/arlington-va","/va/ashburn","/va/centreville",
  "/va/chantilly","/va/chesapeake","/va/fairfax","/va/gainesville-va","/va/hampton","/va/hampton-va",
  "/va/herndon","/va/leesburg","/va/manassas","/va/manassas-park","/va/mount-vernon","/va/newport-news",
  "/va/newport-news-va","/va/norfolk","/va/poquoson","/va/portsmouth","/va/reston","/va/reston-va",
  "/va/richmond-va","/va/roanoke-va","/va/springfield","/va/sterling","/va/suffolk","/va/suffolk-va",
  "/va/virginia-beach","/va/washington-dc","/va/williamsburg","/wi/green-bay","/wi/milwaukee"
];

const CROSS_SUFFIXES = ["-ok","-tn","-ky","-va","-dc","-delaware","-pennsylvania","-maryland","-new-jersey","-new-york"];

function cleanRoute(route) {
  const parts = route.split("/");
  const stateCode = parts[1];
  let slug = parts[2];
  const stateSuffix = `-${stateCode}`;
  if (slug.endsWith(stateSuffix)) slug = slug.slice(0, -stateSuffix.length);
  for (const s of CROSS_SUFFIXES) {
    if (slug.endsWith(s)) slug = slug.slice(0, -s.length);
  }
  return `/${stateCode}/${slug}`;
}

export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const host = body.host || "leadgennearyou.com";
    const base = `https://${host}`;

    const routes = RAW_ROUTES.map(cleanRoute);
    const urlList = routes.map(r => `${base}${r}`);

    // IndexNow accepts up to 10,000 URLs per request — 450 is fine in one batch
    const payload = {
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${base}/${INDEXNOW_KEY}.txt`,
      urlList
    };

    const response = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000)
    });

    const status = response.status;
    const responseText = await response.text().catch(() => "");

    return Response.json({
      ok: status === 200 || status === 202,
      indexNowStatus: status,
      urlsSubmitted: urlList.length,
      host,
      keyLocation: payload.keyLocation,
      responsePreview: responseText.slice(0, 200)
    });
  } catch (error) {
    return Response.json({ error: error.message, ok: false }, { status: 500 });
  }
}