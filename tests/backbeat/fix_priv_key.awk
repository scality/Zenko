{
    for(i = 1; i <= NF; i++) {
        if (index($i, "-----")) {
            printf "%s %s %s\\n", $i, $(i+1), $(i+2);
            i = i + 3;
        } else {
            printf "%s\\n", $i;
        }
    }
}
