const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3006, () => {
      console.log("Server Running at http://localhost:3006/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObjectOne = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
       SELECT * FROM state
    `;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) =>
      convertDbObjectToResponseObjectOne(eachState)
    )
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const getStateQuery = `
        SELECT * FROM 
            state
        WHERE 
            state_id = ${stateId}
             
    `;
  const stateArray = await db.get(getStateQuery);
  response.send(
    stateArray.map((eachState) => convertDbObjectToResponseObjectOne(eachState))
  );
});

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtId,
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
      INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
      VALUES (
          
          "${districtName}",
          ${stateId},
          ${cases},
          ${cured},
          ${active},
          ${deaths}

      );
   `;
  const dbResponse = await db.run(addDistrictQuery);

  response.send("District Successfully added");
});

const convertDbObjectToResponseObjectTwo = (dbObject) => {
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

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT * FROM district
        WHERE 
           district_id = ${districtId};
    `;
  const dbResponse = await db.get(getDistrictQuery);
  response.send(
    dbResponse.map((eachDistrict) =>
      convertDbObjectToResponseObjectTwo(eachDistrict)
    )
  );
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
       DELETE FROM district 
    WHERE 
       district_id = ${districtId}
    `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
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
           district_id = ${districtId}   
    ;`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

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
          state_id = ${stateId};
    `;
  const dbResponse = await db.get(getStatisticsQuery);
  console.log(dbResponse);
  response.send({
    totalCases: dbResponse["SUM(cases)"],
    totalCured: dbResponse["SUM(cured)"],
    totalActive: dbResponse["SUM(active)"],
    totalDeaths: dbResponse["SUM(deaths)"],
  });
});

const convertDbObjectToResponseObjectFour = (dbObject) => {
  return {
    stateName: dbObject.state_name,
  };
};

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
    select state_id from district
    where district_id = ${districtId};
    `; //With this we will get the state_id using district table
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery);
  const getStateNameQuery = `
    select state_name as stateName from state
    where state_id = ${getDistrictIdQueryResponse.state_id};
    `; //With this we will get state_name as stateName using the state_id
  const getStateNameQueryResponse = await database.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
