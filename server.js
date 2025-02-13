require("dotenv").config();
const pg = require("pg");
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;
const client = new pg.Client();

app.use(express.json());
app.use(require("morgan")("dev"));

app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM departments;`;
    const { rows } = await client.query(SQL);
    console.log(rows);
    res.send(rows);
  } catch (err) {
    next(err);
  }
});

app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM employees ORDER BY created_at DESC; `;
    const { rows } = await client.query(SQL);
    res.send(rows);
  } catch (err) {
    next(err);
  }
});

app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL = `INSERT INTO employees(name, text, ranking, department_id) VALUES($1, $2, $3, $4) RETURNING *;`;
    const { rows } = await client.query(SQL, [
      req.body.name,
      req.body.text,
      req.body.ranking,
      req.body.department_id,
    ]);
    res.send(rows);
  } catch (err) {
    next(err);
  }
});

app.put("/api/employees/:id", async (req, res, next) => {
  try {
    console.log(req.body);
    console.log(req.params);
    const SQL = `UPDATE employees SET name=$1 text=$2, ranking=$3, updated_at=now() WHERE id=$4 RETURNING *;`;
    const { rows } = await client.query(SQL, [
      req.body.name,
      req.body.text,
      req.body.ranking,
      req.params.id,
    ]);
    res.send({ message: "successfully updated", result: rows[0] });
  } catch (err) {
    next(err);
  }
});

app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE FROM employees WHERE id=$1;`;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

const init = async () => {
  try {
    await client.connect();
    let SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;
    CREATE TABLE departments(id SERIAL PRIMARY KEY, 
        name VARCHAR(128));
    CREATE TABLE employees(id SERIAL PRIMARY KEY, 
        name VARCHAR(227), text VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        ranking INTEGER DEFAULT 3 NOT NULL,
        department_id INTEGER REFERENCES departments(id) NOT NULL);`;
    console.log("creating tables...");
    await client.query(SQL);
    SQL = `
    INSERT INTO departments(name) VALUES('HR');
    INSERT INTO departments(name) VALUES('Tech');
    INSERT INTO departments(name) VALUES('Accounting');
    INSERT INTO employees(name, text, ranking, department_id) VALUES('John', 'Manager', 5, (SELECT id FROM departments WHERE name='HR'));
    INSERT INTO employees(name, text, ranking, department_id) VALUES('Joe', 'Developer', 4, (SELECT id FROM departments WHERE name='Tech'));
    INSERT INTO employees(name, text, ranking, department_id) VALUES('Jeff', 'Developer', 4, (SELECT id FROM departments WHERE name='Tech'));
    INSERT INTO employees(name, text, ranking, department_id) VALUES('Julia', 'Accountant', 2, (SELECT id FROM departments WHERE name='Accounting'));
    `;
    console.log("Seeding data...");
    await client.query(SQL);
    console.log("seeded");

    app.listen(PORT, () => {
      console.log(`server alive on ${PORT}`);
    });
  } catch (err) {
    console.log(err);
  }
};

init();
