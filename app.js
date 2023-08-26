const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

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

const convertingToCamelCase = (snake_case_array) => {
  const camelCaseArray = snake_case_array.map((eachObj) => {
    const camelCaseObj = {
      stateId: eachObj.state_id,
      stateName: eachObj.state_name,
      population: eachObj.population,
    };
    return camelCaseObj;
  });

  return camelCaseArray;
};

// GET all states in camelCase API 1

app.get("/states/", async (request, response) => {
  const getAllStatesArrayQuery = `SELECT *
    FROM 
        state; `;

  const statesArraySnakeCase = await db.all(getAllStatesArrayQuery);
  const camelCaseResultArray = convertingToCamelCase(statesArraySnakeCase);
  response.send(camelCaseResultArray);
});

// GET all states based on state_id in camelCase API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getAllStatesArrayQuery = `SELECT *
    FROM 
        state
    WHERE 
        state_id = ${stateId}; `;

  const statesObjectSnakeCase = await db.get(getAllStatesArrayQuery);
  const camelCaseResultObj = {
    stateId: statesObjectSnakeCase.state_id,
    stateName: statesObjectSnakeCase.state_name,
    population: statesObjectSnakeCase.population,
  };
  response.send(camelCaseResultObj);
});

//Create a district in the district table API 3
app.post("/districts/", async (request, response) => {
  const districtColumns = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtColumns;
  const createDistrictDetailsQuery = `
        INSERT INTO
          district (district_name, state_id, cases, cured, active, deaths )
        VALUES ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths}); `;

  await db.run(createDistrictDetailsQuery);
  response.send("District Successfully Added");
});

// GET a district based on the district ID API 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetailsQuery = `
    SELECT  *
    FROM
        district
  WHERE
      district_id = ${districtId} ;`;
  const districtObj = await db.get(getDistrictDetailsQuery);
  const resultObj = {
    districtId: districtObj.district_id,
    districtName: districtObj.district_name,
    stateId: districtObj.state_id,
    cases: districtObj.cases,
    cured: districtObj.cured,
    active: districtObj.active,
    deaths: districtObj.deaths,
  };
  response.send(resultObj);
});

// DELETE row from district API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictDetailsQuery = `
    DELETE FROM
      district
    WHERE
        district_id = ${districtId};
    `;
  await db.run(deleteDistrictDetailsQuery);
  response.send("District Removed");
});

//Updates the details of a specific district based on the district ID API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictDetailsQuery = `
    UPDATE
      district
    SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active=${active},
        deaths = ${deaths}
    WHERE
         district_id = ${districtId};
    `;
  await db.run(updateDistrictDetailsQuery);
  response.send("District Details Updated");
});

// GET Returns the statistics state based on state ID camelCase API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatisticsQuery = `
    SELECT 
        SUM(cases), SUM(cured), SUM(active), SUM(deaths)
    FROM 
        district
    WHERE
        state_id = ${stateId}; `;

  const StateStatisticsObject = await db.get(getStateStatisticsQuery);
  const resultObj = {
    totalCases: StateStatisticsObject["SUM(cases)"],
    totalCured: StateStatisticsObject["SUM(cured)"],
    totalActive: StateStatisticsObject["SUM(active)"],
    totalDeaths: StateStatisticsObject["SUM(deaths)"],
  };

  response.send(resultObj);
});

//GET an object based on the district ID API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `SELECT state.state_name
    FROM 
        state LEFT JOIN district ON state.state_id = district.state_id
    WHERE
        district.district_id = ${districtId}; `;

  const stateNameObject = await db.get(getStateNameQuery);
  const camelCaseResultArray = {
    stateName: stateNameObject.state_name,
  };

  response.send(camelCaseResultArray);
});

module.exports = app;
