require('dotenv').config({ path: '../.env'});
require("../db.js");
require("./wipe_db")
const {Company, Status: CompanyStatus} = require('../models/company')
const {Department, Status: DepartmentStatus} = require('../models/department')
const User = require('../models/user')
const fs = require('fs');

const companies = [];
const departments = [];
const users = [];
const commonGivenNames = parseCSV('./common_swedish_given_names.txt');
const commonSurnames = parseCSV('./common_swedish_surnames.txt');

// Companies
async function createCompanies() {
    const companyData = [
        {name: "Arveti", code: "0010", status: CompanyStatus.ACTIVE},
        {name: "Bisho",code: "0011",status: CompanyStatus.ACTIVE},
        {name: "Citrim",code: "0012",status: CompanyStatus.ACTIVE},
        {name: "Denta",code: "0013",status: CompanyStatus.ACTIVE},
        {name: "Epster",code: "0014",status: CompanyStatus.ONBOARDING},
        {name: "Fwiendly",code: "0015",status: CompanyStatus.DECOMISSIONED}
    ];

    for(const company of companyData){
        const newCompany =  new Company(company);
        const savedCompany = await newCompany.save();
        companies.push(savedCompany);
        console.log(`Saved Company: ${savedCompany}`);
    }

    companies[1].parent = companies[0];
    companies[2].parent = companies[0];
    companies[4].parent = companies[3];
    await Promise.all([
        companies[1].save(),
        companies[2].save(),
        companies[4].save(),
    ]); 
}

async function createDepartments() {
    const departmentData = [
        // Arveti
        { 
            company: companies[0]._id,
            departments: [
                {name: "IT"},
                {name: "Finance"},
                {name: "HR"},
                {name: "Sales"},
                {name: "PR"},
                {name: "R&D"},
                {name: "Operations"}
            ]
        },
    
            // Bisho
            {
                company: companies[1]._id,
                departments: [
                    {name: "Sales"},
                    {name: "Operations"}
                ]
            },
    
            // Citrim
            {
                company: companies[2]._id,
                departments: [
                    {name: "Sales"},
                    {name: "Operations"},
                    {name: "Finance"},
                    {name: "R&D", status: DepartmentStatus.CLOSED}
                ]
            },
    
        // Denta
        {
            company: companies[3]._id,
            departments: [
                {name: "IT"},
                {name: "Finance"},
                {name: "HR"},
                {name: "Sales"},
                {name: "PR"},
                {name: "R&D"},
                {name: "Operations"}
            ]
        },
    
            // Epster - Onboarding
            {
                company: companies[4]._id,
                departments: [
                    {name: "Sales"},
                    {name: "Operations"},
                    {name: "PR"}
                ],
    
            }
    ]
    
    for(const companyDepartments of departmentData){
        console.log("Creating deparments for company " + companyDepartments.company)
        for(const department of companyDepartments.departments){
            department.company = companyDepartments.company;
            const newDepartment = new Department(department);
            const savedDepartment = await newDepartment.save();
            departments.push(savedDepartment);
            console.log(`Saved Department: ${savedDepartment}`)
        }
    }
}

// TODO: add valid m365 licenses
async function createUsers() {

    // Arveti - 500 employees
    await generateUsers(500, departments.filter(department => department.company._id.toString() === companies[0]._id.toString() && department.status != DepartmentStatus.CLOSED));

    // Bisho - 80 employees
    await generateUsers(80, departments.filter(department => department.company._id.toString() === companies[1]._id.toString() && department.status != DepartmentStatus.CLOSED));

    // Citrim - 220 employees
    await generateUsers(220, departments.filter(department => department.company._id.toString() === companies[2]._id.toString() && department.status != DepartmentStatus.CLOSED));

    // Denta - 380 employees
    await generateUsers(380, departments.filter(department => department.company._id.toString() === companies[3]._id.toString() && department.status != DepartmentStatus.CLOSED));

    // Epster - 50 employees
    await generateUsers(50, departments.filter(department => department.company._id.toString() === companies[4]._id.toString() && department.status != DepartmentStatus.CLOSED));

}

async function generateUsers(amount, departments) {
    const createdUsers = [];
    let amountStrategy;

    if (amount <= 150) {
        amountStrategy = [4, 2, 2, 1];
    } else if (amount <= 500) {
        amountStrategy = [5, 3, 3, 1];
    } else {
        amountStrategy = [6, 4, 4, 1];
    }

    for (let i = 0; i < amount; i++) {
        const givenName = commonGivenNames[Math.floor(Math.random() * Math.floor(commonGivenNames.length))];
        const surname = commonSurnames[Math.floor(Math.random() * Math.floor(commonSurnames.length))];
        let counter = 0;
        let email = "";
        let candidateEmail = "";
        while (counter <= 100 && !email){
            if (counter === 0) {
                candidateEmail = `${givenName}.${surname}@example.com`.toLowerCase();
            } else {
                candidateEmail = `${givenName}.${surname}${counter}@example.com`.toLowerCase();
            }
            if(createdUsers.filter(({email}) => email === candidateEmail).length > 0){
                counter ++;
            } else {
                email = candidateEmail;
            }
        }

        const userData = {
            givenName: givenName,
            surname: surname,
            department: departments[Math.floor(Math.random() * Math.floor(departments.length))],
            email: email
        }

        const newUser = new User(userData);
        try {
            const savedUser = await newUser.save();
            createdUsers.push(savedUser);
            console.log(`Saved User ${i}`);
        } catch (err) {
            console.log("Saving user failed:");
            console.log(err);
        }
    }

    const assigned = [];
    const numManagers = amountStrategy.reduce((sum, val) => sum * val);
    const totalDirectReports = createdUsers.length - numManagers;
    const numLineManagers = amountStrategy[0];

    // assign managers
    for(let i = 0; i < createdUsers.length; i++){
        if(amountStrategy.length === 0){ 
            break; // only direct reports left
        }

        let numDirectReports;
        if(amountStrategy.length === 1){ // line managers consume remaining as direct reports
            numDirectReports = Math.floor(totalDirectReports / numLineManagers);  
        } else {
            numDirectReports = amountStrategy[amountStrategy.length - 2];
        }

        if(amountStrategy[amountStrategy.length - 1] === 1){ // peek last
            amountStrategy.pop()
        } else {
            amountStrategy[amountStrategy.length - 1] -= 1;
        }

        for(let j = i + 1; j <= createdUsers.length; j++){
            if(numDirectReports === 0 ){
                break;
            }

            if(!assigned.includes(createdUsers[j])) {
                createdUsers[j].manager = createdUsers[i];
                assigned.push(createdUsers[j])
                numDirectReports--;
                await createdUsers[j].save();
            }
        }
    users.push(...createdUsers)
   }
}
function parseCSV(csvFilePath) {
    const fileData = fs.readFileSync(csvFilePath, 'utf-8');
    return fileData.split('\n');
}

// Will only be able to run once since company codes are unique
function populateDb() {
    createCompanies()
    .then(() => createDepartments())
    .then(() => createUsers())
    .catch((err) => {
        console.log(err);
    });
}

populateDb();