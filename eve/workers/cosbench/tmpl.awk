BEGIN{
    values["ACCESS_KEY"] = ak;
    values["SECRET_KEY"] = sk;
    values["ENDPOINT"] = ep;
}

{
    for (tmpl in values)
        gsub("{{"tmpl"}}", values[tmpl]);
    print $0;
}
