const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const { Company, Status: CompanyStatus } = require("../models/company");
const { getLicenses } = require("../fetch_licenses");
const { body, validationResult } = require("express-validator");

exports.user_get = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).populate(["department", "directReports", "manager", "company"]);
    res.render("user_get", { title: user.fullName, user: user});
});

exports.user_search = asyncHandler(async (req, res) => {
    const nameParts = req.query.q?.split(' ') || [];

    const selectedCategories = req.query.categories && JSON.parse(req.query.categories);

    const query = {};

    if (selectedCategories?.department) {
        query.department = { $in: selectedCategories.department };
    }

    if (selectedCategories?.company.length > 0) {
        query.company = { $in: selectedCategories.company };
    }

    const nameQuery = async (givenName, surname, op = 'and') => {
        if (!givenName && !surname) {
            return User.find(query).populate(["directReports"]);
        }

        const _query = { ...query };
        if (op === 'or') {
            _query.$or = [
                givenName && { givenName: { $regex: givenName, $options: 'i' } },
                surname && { surname: { $regex: surname, $options: 'i' } },
            ].filter(Boolean);
        } else if (op === 'and') {
            _query.$and = [
                { givenName: { $regex: givenName, $options: 'i' } },
                { surname: { $regex: surname, $options: 'i' } },
            ];
        }
        return User.find(_query).populate(["directReports"]);
    }

    try {
        let result = [];
        if (nameParts.length > 1) {
            result = await nameQuery(nameParts.slice(0, nameParts.length - 1).join(' '), nameParts[nameParts.length - 1]);

            // givenName, cover remaining combinations
            if (result.length === 0) {
                for (let i = 2; i < nameParts.length; i++) {
                    result = await nameQuery(nameParts.slice(0, i).join(' '), undefined, 'or');
                    if (result.length > 0) {
                        break;
                    }
                }
            }

            // surname, cover remaining combinations
            if (result.length === 0) {
                for (let i = 2; i < nameParts.length; i++) {
                    result = await nameQuery(undefined, nameParts.slice(0, i).join(' '), 'or');
                    if (result.length > 0) {
                        break;
                    }
                }
            }
        } else {
            result = await nameQuery(nameParts[0], nameParts[0], 'or');
        }

        if (selectedCategories?.isManager) {
            result = result.filter(({ directReports }) => directReports.length > 0);
        }

        const jsonResponse = result.map(user => {
            const fullName = user.fullName;
            const userObject = user.toObject();
            userObject.fullName = fullName;
            return userObject;
        })
        res.json(jsonResponse);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while searching for users.' });
    }
});

// Display user create form on GET.
exports.user_create_get = asyncHandler(async (req, res) => {
    const companies = await Company.find({ status: { $ne: CompanyStatus.DECOMISSIONED } }).populate('departments').exec();


    const companyWithDepartment = companies.map(company => {
        const departments = company.departments;
        const companyObject = company.toObject();
        companyObject.departments = departments;
        return companyObject;
    });

    const licenses = await getLicenses();
    res.render("forms/user_form", { title: "Create User", companies: companyWithDepartment, licenses });
});

const postTypes = {
    CREATE: 'create',
    UPDATE: 'update',
}

function user_post(type) {
    if (type != postTypes.CREATE && type != postTypes.UPDATE) {
        throw Error('user_post must be called with a valid type');
    }
    return [
        // Validate and sanitize the name field.
        body("givenName", "First name must contain at least 1 character")
            .trim()
            .isLength({ min: 1 })
            .escape(),
        body("surname", "Last name must contain at least 1 character")
            .trim()
            .isLength({ min: 1 })
            .escape(),
        body("email", "Email must be a valid email address")
            .isEmail(),
        body("company", "Users must have a company")
            .trim()
            .escape()
            .notEmpty(),

        asyncHandler(async (req, res) => {
            const errors = validationResult(req);

            const newUser = {
                givenName: req.body.givenName,
                surname: req.body.surname,
                company: req.body.company,
                email: req.body.email
            }

            if (req.body.manager) {
                newUser.manager = req.body.manager;
            }

            if (req.body.department && !req.body.department.match(/None/i)) {
                newUser.department = req.body.department;
            }

            if (req.body.m365License && !req.body.m365License.match(/None/i)) {
                newUser.m365License = req.body.m365License;
            }

            if (type === postTypes.UPDATE) {
                newUser._id = req.params.id;
            }

            const user = new User(newUser);
            const companies = await Company.find({ status: { $ne: CompanyStatus.DECOMISSIONED } }).exec();

            if (!errors.isEmpty()) {
                const formData = {
                    user: user,
                    licenses: await getLicenses(),
                    companies: companies,
                    errors: errors.array(),
                }

                if (type === postTypes.CREATE) {
                    formData.title = "Create User";
                } else if (type === postTypes.UPDATE) {
                    formData.title = "Update User";
                }

                res.render("forms/user_form", formData);
                return;
            } else {
                if (type === postTypes.CREATE) {
                    await user.save();
                } else if (type === postTypes.UPDATE) {
                    await User.findByIdAndUpdate(req.params.id, user, {});
                }

                res.redirect(user.url);
            }
        }),
    ];
}

// Handle user create on POST.
exports.user_create_post = user_post(postTypes.CREATE);

// Display user delete form on GET.
exports.user_delete_get = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user === null) {
        res.redirect("/users")
    }

    res.render("forms/user_delete", { title: "Delete User", user: user});
});

// Handle user delete on POST.
exports.user_delete_post = asyncHandler(async (req, res) => {
    const user = await User.findById(req.body.userId);
    if (user !== null) {
        await User.findByIdAndRemove(req.body.userId);
    }
    res.redirect("/users");
});

// Display user update form on GET.
exports.user_update_get = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    const companies = await Company.find({ status: { $ne: CompanyStatus.DECOMISSIONED } }).populate('departments').exec();

    if (user === null) {
        const err = new Error("User not found");
        err.status = 404;
        return next(err);
    }

    const companyWithDepartment = companies.map(company => {
        const departments = company.departments;
        const companyObject = company.toObject();
        companyObject.departments = departments;
        return companyObject;
    });

    const licenses = await getLicenses();
    res.render("forms/user_form", { title: "Update User", user: user, companies: companyWithDepartment, licenses });
});

// Handle user update on POST.
exports.user_update_post = user_post(postTypes.UPDATE);

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

    if (!givenName || !surname || !domain) {
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


    for (const [key, value] of charConversionMap) {
        generatedMailNickname = generatedMailNickname.replaceAll(key, value);
    }

    generatedMailNickname = generatedMailNickname.normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents 
        .replace(/[^a-zA-Z0-9_/-@.]/g, '') // remove illegal email characters

    let suffix = 0;
    let unique = false;
    while (!unique) {
        const candidateEmail = (generatedMailNickname + (suffix > 0 ? suffix : '')).toLowerCase();
        const matches = await User.find({ email: candidateEmail + '@' + domain });
        if (matches.length === 0) {
            unique = true;
            generatedMailNickname = candidateEmail;
        }
        suffix++;
    }
    res.send(generatedMailNickname + '@' + domain);
});