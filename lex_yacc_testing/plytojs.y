%{
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "plytojs.h"

int vertexNo = 0;
int faceNo = 0;
int vertexPropertiesNo = 0;
int drawPointCount = 0;

int x = -1;
int y = -1;
int z = -1;
int nx = -1;
int ny = -1;
int nz = -1;
int red = -1;
int green = -1;
int blue = -1;
int alpha = -1;
int s = -1;
int t = -1;

char** valuesArray = NULL;
size_t valuesArrayCap = 0;
size_t valuesArrayI = 0;

int yylex(void);
void yyerror(char *);
void increaseCap( void );
%}

%token PLY
%token END_HEADER
%token VALID_FORMAT
%token COMMENT
%token ELEMENT
%token PROPERTY
%token CHAR
%token UCHAR
%token SHORT
%token USHORT
%token INT
%token UINT
%token FLOAT
%token DOUBLE
%token LIST
%token VERTEX
%token FACE
%token VERTEX_INDICES
%token X
%token Y
%token Z
%token NX
%token NY
%token NZ
%token RED
%token GREEN
%token BLUE
%token ALPHA
%token S
%token T
%token INT_LITERAL
%token FLOAT_LITERAL

%%

file:   header elementList {

    fprintf(stderr, "Full file read\n");
}
    ;

header: PLY VALID_FORMAT header_contents END_HEADER
    ;

header_contents:    header_contents header_statement
                |   header_statement
                |
                ;

header_statement:   COMMENT
                |   element_definition
                ;

element_definition: vertex_definition
                |   face_definition
                ;

vertex_definition:  ELEMENT VERTEX INT_LITERAL vertex_properties {

    vertexNo = $3;
}
                ;

vertex_properties:  vertex_properties vertex_property
                |   vertex_property
                |
                ;

vertex_property:    PROPERTY number_type X      { x = vertexPropertiesNo++; }
                |   PROPERTY number_type Y      { y = vertexPropertiesNo++; }
                |   PROPERTY number_type Z      { z = vertexPropertiesNo++; }
                |   PROPERTY number_type NX     { nx = vertexPropertiesNo++; }
                |   PROPERTY number_type NY     { ny = vertexPropertiesNo++; }
                |   PROPERTY number_type NZ     { nz = vertexPropertiesNo++; }
                |   PROPERTY number_type S      { s = vertexPropertiesNo++; }
                |   PROPERTY number_type T      { t = vertexPropertiesNo++; }
                |   PROPERTY number_type RED    { red = vertexPropertiesNo++; }
                |   PROPERTY number_type GREEN  { green = vertexPropertiesNo++; }
                |   PROPERTY number_type BLUE   { blue = vertexPropertiesNo++; }
                |   PROPERTY number_type ALPHA  { alpha = vertexPropertiesNo++; }
                ;

face_definition:    ELEMENT FACE INT_LITERAL face_property {

    faceNo = $3;
}
                ;

face_property:  PROPERTY LIST unsigned_type number_type VERTEX_INDICES
            |
            ;

number_type:    CHAR | UCHAR | SHORT | USHORT | INT | UINT | FLOAT | DOUBLE
            ;

unsigned_type:  UCHAR | USHORT | UINT
            ;

elementList:    elementList number_add_to_values_array
            |   number_add_to_values_array
            |
            ;

number_add_to_values_array: number  {

    // Increase array capacity
    while (valuesArrayI >= valuesArrayCap)
    {
        increaseCap();
    }
    // Allocate space for the new value
    valuesArray[valuesArrayI] = malloc(strlen(valueBuffer) + 1);
    if (valuesArray[valuesArrayI] == NULL)
    {
        yyerror("Unable to allocate space to add new value to values array");
        exit(-1);
    }
    strcpy(valuesArray[valuesArrayI], valueBuffer);
    valuesArrayI++;
}
                        ;

number: INT_LITERAL | FLOAT_LITERAL
    ;

%%

void yyerror(char *s)
{
    fprintf(stderr, "%s: Line: \n", s);
}

// Increases the capacity of the valuesArray
void increaseCap( void )
{
    char** newValuesArray = malloc((valuesArrayCap + 100) * sizeof(char*));
    if (newValuesArray == NULL)
    {
        perror("Failed to increase size of values array when needed");
        exit(-1);
    }
    memcpy((void*) newValuesArray, (void*) valuesArray, valuesArrayCap * sizeof(char*));
    free(valuesArray);
    valuesArray = newValuesArray;
    valuesArrayCap += 100;
}

int main(void)
{
    // Allocate space for the values array
    valuesArray = malloc(sizeof(char*) * 100);
    if (valuesArray == NULL)
    {
        perror("Unable to initially allocate space for values array");
        return -1;
    }
    valuesArrayCap = 100;
    
    yyparse();

    //fprintf(stderr, "Values array i final value: %lu\n", valuesArrayI);

    //fprintf(stderr, "Values array capacity: %lu\n", valuesArrayCap);

    fprintf(stderr, "Number of vertices: %i\n", vertexNo);
    fprintf(stderr, "Number of properties per vertex: %i\n", vertexPropertiesNo);
    fprintf(stderr, "Number of faces: %i\n", faceNo);

    fprintf(stderr, "Order of x property: %i\n", x);
    fprintf(stderr, "Order of y property: %i\n", y);
    fprintf(stderr, "Order of z property: %i\n", z);
    fprintf(stderr, "Order of nx property: %i\n", nx);
    fprintf(stderr, "Order of ny property: %i\n", ny);
    fprintf(stderr, "Order of nz property: %i\n", nz);
    fprintf(stderr, "Order of s property: %i\n", s);
    fprintf(stderr, "Order of t property: %i\n", t);
    fprintf(stderr, "Order of red property: %i\n", red);
    fprintf(stderr, "Order of green property: %i\n", green);
    fprintf(stderr, "Order of blue property: %i\n", blue);
    fprintf(stderr, "Order of alpha property: %i\n", alpha);

    /*for (size_t i = 0; i < valuesArrayI; i++)
    {
        fprintf(stderr, "%lu: %s\n", i, valuesArray[i]);
    }*/

    // Error checking
    if (nx < 0 || ny < 0 || nz < 0)
    {
        fprintf(stderr, "Error, input does not contain values for vertex normals\n");
        return -1;
    }

    // Begin outputing js file
    printf("{\n");

    // Print vertex values
    printf("    vertexValues: [\n");

    for (size_t v = 0; v < vertexNo; v++) // For each vertex
    {
        printf("        ");

        size_t index;

        index = v * vertexPropertiesNo + x;
        printf("%s, ", valuesArray[index]);
        index = v * vertexPropertiesNo + y;
        printf("%s, ", valuesArray[index]);
        index = v * vertexPropertiesNo + z;
        printf("%s, ", valuesArray[index]);

        printf("\n");
    }

    printf("    ],\n");

    // Print normal values
    printf("    normalValues: [\n");

    for (size_t v = 0; v < vertexNo; v++) // For each vertex
    {
        printf("        ");

        size_t index;

        index = v * vertexPropertiesNo + nx;
        printf("%s, ", valuesArray[index]);
        index = v * vertexPropertiesNo + ny;
        printf("%s, ", valuesArray[index]);
        index = v * vertexPropertiesNo + nz;
        printf("%s, ", valuesArray[index]);

        printf("\n");
    }

    printf("    ],\n");

    // Print colors
    printf("    colorValues: [\n");

    for (size_t v = 0; v < vertexNo; v++) // For each vertex
    {
        printf("        ");

        // If no rgb specified, print white
        if (red < 0 || green < 0 || blue < 0)
        {
            printf("1.0, 1.0, 1.0, ");
        }
        else
        {
            size_t index;

            index = v * vertexPropertiesNo + red;
            printf("%s.0/256.0, ", valuesArray[index]);
            index = v * vertexPropertiesNo + green;
            printf("%s.0/256.0, ", valuesArray[index]);
            index = v * vertexPropertiesNo + blue;
            printf("%s.0/256.0, ", valuesArray[index]);
        }

        // If no alpha specified, print 1.0
        if (alpha < 0)
        {
            printf("1.0");
        }
        else
        {
            size_t index;

            index = v * vertexPropertiesNo + alpha;
            printf("%s.0/256.0, ", valuesArray[index]);
        }

        printf("\n");
    }

    printf("    ],\n");

    // Print index lists
    printf("    drawPointIndices: [\n");

    size_t lastIndex = vertexNo * vertexPropertiesNo - 1;
    for (size_t f = 0; f < faceNo; f++)
    {
        printf("        ");

        size_t index;

        // Get index count
        index = lastIndex + 1;
        int indexCount = atoi(valuesArray[index]);
        //fprintf(stderr, "Index count: %i\n", indexCount);

        // Get index of central vertex
        index++;
        int centralVertex = index;
        //fprintf(stderr, "Central index: %s\n", valuesArray[index]);

        // Begin printing
        index += 2;
        for (int i=index; i < index + indexCount - 2; i++)
        {
            printf("%s, %s, %s, ", valuesArray[centralVertex], valuesArray[i - 1], valuesArray[i]);
            drawPointCount += 3;
        }

        // Update lastIndex
        lastIndex += indexCount + 1;

        printf("\n");
    }

    printf("    ],\n");

    // Print drawPointCount
    printf("    drawPointCount: %i,\n", drawPointCount);

    printf("}");

    free(valuesArray);

    return 0;
}
