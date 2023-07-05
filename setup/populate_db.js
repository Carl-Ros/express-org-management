require("../db.js")

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
        {name: "Arveti", code: "0001", status: CompanyStatus.ACTIVE},
        {name: "Bisho",code: "0002",status: CompanyStatus.ACTIVE},
        {name: "Citrim",code: "0003",status: CompanyStatus.ACTIVE},
        {name: "Denta",code: "0004",status: CompanyStatus.ACTIVE},
        {name: "Epster",code: "0005",status: CompanyStatus.ONBOARDING},
        {name: "Fwiendly",code: "0006",status: CompanyStatus.DECOMISSIONED}
    ];

    for(const company of companyData){
        const newCompany =  new Company(company);
        const savedCompany = await newCompany.save();
        companies.push(savedCompany);
        console.log(`Saved Company: ${savedCompany}`);
    }
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
                candidateEmail = `${givenName}.${counter}${surname}@example.com`.toLowerCase();
            }
            if(users.filter(({email}) => email === candidateEmail).length > 0){
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
            users.push(savedUser);
            console.log(`Saved User: ${savedUser}`);
        } catch (err) {
            console.log("Saving user failed:");
            console.log(err);
        }

        // roughly 8 employees per manager
        if (users.length % 8 === 0){
            users[users.length - 1].manager = users[Math.floor(Math.random() * Math.floor(users.length - 1))];
            try {
                users[users.length - 1].save();
            } catch (err) {
                // suppressed
            }
        }
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