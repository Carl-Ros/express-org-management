const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const { Company, Status: CompanyStatus } = require("../models/company")

exports.user_get = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).populate(["department", "directReports", "manager"]); // add geolocation
    console.log(user)
    res.render("user_get", { title: user.fullName, user: user, company: await user.company });
});

exports.user_search = asyncHandler(async (req, res) => {
    const nameParts = req.query.q?.split(' ') || [];

    const selectedCategories = req.query.categories && JSON.parse(req.query.categories);

    const query = {};

    if(selectedCategories?.department) {
        query.department = { $in: selectedCategories.department};
    }

    if(selectedCategories?.company.length > 0) {
        query.company = { $in: selectedCategories.company};
    }

    const nameQuery = async (givenName, surname, op = 'and') => {
        if(!givenName && !surname){
            return User.find(query).populate(["directReports"]);
        }

        const _query = { ...query };
        if(op === 'or'){
            _query.$or = [
                givenName && { givenName: { $regex: givenName, $options: 'i' } },
                surname && { surname: { $regex: surname, $options: 'i' } },
            ].filter(Boolean);
        } else if (op === 'and'){
            _query.$and = [
                { givenName: { $regex: givenName, $options: 'i' } },
                { surname: { $regex: surname, $options: 'i' } },
            ];
        }
        return User.find(_query).populate(["directReports"]);
    }

    try {
        let result = [];
        if(nameParts.length > 1){
            result = await nameQuery(nameParts.slice(0, nameParts.length - 1).join(' '), nameParts[nameParts.length - 1]);
            
            // givenName, cover remaining combinations
            if(result.length === 0){
                for(let i = 2; i < nameParts.length; i++){
                    result = await nameQuery(nameParts.slice(0, i).join(' '), undefined, 'or');
                    if(result.length > 0){
                        break;
                    }
                }
            }
            
            // surname, cover remaining combinations
            if(result.length === 0){
                for(let i = 2; i < nameParts.length; i++){
                    result = await nameQuery(undefined, nameParts.slice(0, i).join(' '), 'or');
                    if(result.length > 0){
                        break;
                    }
                }
            }
        } else {
            result = await nameQuery(nameParts[0], nameParts[0], 'or');
        }
        
        if(selectedCategories?.isManager){
            result = result.filter(({ directReports }) => directReports.length > 0 );
        }

        const jsonResponse = result.map(user => {
            const fullName = user.fullName;
            const userObject = user.toObject();
            userObject.fullName = fullName;
            return userObject;
        })

        console.log(jsonResponse)
        res.json(jsonResponse);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while searching for users.' });
    }
});

// Display user create form on GET.
exports.user_create_get = asyncHandler(async (req, res) => {
    const companies = await Company.find({ status: { $ne: CompanyStatus.DECOMISSIONED } }).exec();
    res.render("forms/user_form", { title: "Create User", companies: companies});
  });

// Handle user create on POST.
exports.user_create_post = asyncHandler(async (req, res) => {
    res.send("NOT IMPLEMENTED: user create POST");
});

// Display user delete form on GET.
exports.user_delete_get = asyncHandler(async (req, res) => {
    res.render("NOT IMPLEMENTED: user delete GET");
});

// Handle user delete on POST.
exports.user_delete_post = asyncHandler(async (req, res) => {
    res.send("NOT IMPLEMENTED: user delete POST");
});

// Display user update form on GET.
exports.user_update_get = asyncHandler(async (req, res) => {
    res.send("NOT IMPLEMENTED: user update GET");
});

// Handle user update on POST.
exports.user_update_post = asyncHandler(async (req, res) => {
    res.send("NOT IMPLEMENTED: user update POST");
});

exports.user_list = asyncHandler(async (req, res) => {
    const companies = await Company.find({ status: { $ne: CompanyStatus.DECOMISSIONED } }).exec();
    res.render("user_list", {
        title: "Users", companies
    });
});

// Generate unique email
exports.user_generate_email_get = asyncHandler(async (req, res) => {
    let givenName = req.query.givenName;
    let surname = req.query.surname;
    let domain = req.query.domain;
    
    if(!givenName || !surname || !domain){
        res.status(400).json({ error: 'Missing mandatory parameter' });
        return;
    }

    const charConversionMap = new Map(
        [
            ['Å', 'AA'],
            ['Ä', 'AE'],
            ['Ö', 'OE'],
            ['å', 'aa'],
            ['ä', 'ae'],
            ['ö', 'oe'],
            [' ', '_'],
            ['-', '_'],
        ]
    )

    let generatedMailNickname = (givenName.trim() + '.' + surname.trim()).replace(/\s+/g, ' ') //remove repeated whitespace
    

    for(const [key, value] of charConversionMap){
        generatedMailNickname = generatedMailNickname.replaceAll(key, value);
    }

    generatedMailNickname = generatedMailNickname.normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents 
    .replace(/[^a-zA-Z0-9_/-@.]/g,'') // remove illegal email characters
    

    let suffix = 0;
    let unique = false;
    while(!unique){
        const candidateEmail = (generatedMailNickname + (suffix > 0 ? suffix : '') ).toLowerCase();
        const matches = await User.find({email: candidateEmail + '@' + domain});
        if(matches.length === 0){
            unique = true;
            generatedMailNickname = candidateEmail;
        }
        suffix++;    
    }
    res.send(generatedMailNickname + '@' + domain);
});