const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertStatesDbIntoResponseDb = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictsDbIntoResponseDb = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//Get All States API
app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `
SELECT * 
FROM 
state;`;
  const getAllStatesArray = await db.all(getAllStatesQuery);
  response.send(
    getAllStatesArray.map((eachState) =>
      convertStatesDbIntoResponseDb(eachState)
    )
  );
});

//Get State API
app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT *
    FROM 
    state
    WHERE
    state_id = ${stateId};`;
  const getStateArray = await db.get(getStateQuery);
  response.send(convertStatesDbIntoResponseDb(getStateArray));
});

//Post District API
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
    INSERT INTO
    district(state_id,district_name,cases,cured,active,deaths)
    VALUES
     (${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths});`;
  const postDistrictArray = await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//Get District API
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
SELECT *
FROM 
district
WHERE
district_id = ${districtId};`;
  const getDistrictArray = await db.get(getDistrictQuery);
  response.send(convertDistrictsDbIntoResponseDb(getDistrictArray));
});

//Delete District API
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE
    FROM
    district
    WHERE
    district_id = ${districtId};`;
  const deleteDistrictArray = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Put District API
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const putDistrictQuery = `
UPDATE
district
SET
district_name = "${districtName}",
state_id = ${stateId},
cases = ${cases},
cured = ${cured},
active = ${active},
deaths = ${deaths}
WHERE
district_id = ${districtId};`;
  const putDistrictArray = await db.run(putDistrictQuery);
  response.send("District Details Updated");
});

//Get Statistics API
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatisticsQuery = `
SELECT
SUM(cases),
SUM(cured),
SUM(active),
SUM(deaths)
FROM 
district
WHERE
state_id = ${stateId};`;
  const getStatisticsArray = await db.get(getStatisticsQuery);
  response.send({
    totalCases: getStatisticsArray["SUM(cases)"],
    totalCured: getStatisticsArray["SUM(cured)"],
    totalActive: getStatisticsArray["SUM(active)"],
    totalDeaths: getStatisticsArray["SUM(deaths)"],
  });
});

//Get State API
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT 
    state_name
    FROM 
    district
    NATURAL JOIN 
    state
    WHERE
    district_id = ${districtId};`;
  const getStateNameArray = await db.get(getStateNameQuery);
  response.send({ stateName: getStateNameArray.state_name });
});

module.exports = app;
